/**
 * Internal dependencies
 */
import { expect, test as baseTest } from '../../fixtures/fixtures';
import { ADMIN_STATE_PATH } from '../../playwright.config';
import { getFakeProduct } from '../../utils/data';
import { toggleVariableProductTour } from '../../utils/tours';

const productAttributes = [
	{
		name: 'Colour',
		visible: true,
		variation: true,
		options: [ 'Red', 'Green' ],
	},
	{
		name: 'Size',
		visible: true,
		variation: true,
		options: [ 'Small', 'Medium' ],
	},
	{
		name: 'Logo',
		visible: true,
		variation: true,
		options: [ 'Woo', 'WordPress' ],
	},
];

const test = baseTest.extend( {
	storageState: ADMIN_STATE_PATH,
	product: async ( { api }, use ) => {
		let product = getFakeProduct( { type: 'variable' } );

		await api.post( 'products', product ).then( ( response ) => {
			product = response.data;
		} );

		await use( product );

		await api.delete( `products/${ product.id }`, {
			force: true,
		} );
	},
} );

/**
 *
 * @param {import('@playwright/test').Page} page
 */
async function goToAttributesTab( page ) {
	await test.step( 'Go to the "Attributes" tab.', async () => {
		const attributesTab = page
			.locator( '.attribute_tab' )
			.getByRole( 'link', { name: 'Attributes' } );

		await attributesTab.click();
	} );
}
async function addAttribute(
	page,
	attributeName,
	attributeValues,
	firstAttribute
) {
	if ( ! firstAttribute ) {
		await test.step( "Click 'Add new'.", async () => {
			await page.getByRole( 'button', { name: 'Add new' } ).click();

			await expect(
				page
					.getByRole( 'heading', {
						name: 'New attribute',
					} )
					.first()
			).toBeVisible();
		} );
	}

	await test.step( `Type "${ attributeName }" in the "Attribute name" input field.`, async () => {
		await page
			.getByPlaceholder( 'e.g. length or weight' )
			.last()
			.type( attributeName );
	} );

	await test.step( `Type the attribute values "${ attributeValues }".`, async () => {
		await page
			.getByPlaceholder( 'Enter options for customers to choose from' )
			.last()
			.type( attributeValues );
	} );

	await test.step( `Expect "Visible on the product page" checkbox to be checked by default`, async () => {
		await expect(
			page
				.getByText( 'Visible on the product page' )
				.getByRole( 'checkbox' )
				.last()
		).toBeChecked();
	} );

	await test.step( `Expect "Used for variations" checkbox to be checked by default`, async () => {
		await expect(
			page
				.getByText( 'Used for variations' )
				.getByRole( 'checkbox' )
				.last()
		).toBeChecked();
	} );

	await test.step( 'Click "Save attributes".', async () => {
		await page
			.getByRole( 'button', {
				name: 'Save attributes',
			} )
			.click();
	} );

	await test.step( "Wait for the tour's dismissal to be saved", async () => {
		await page.waitForResponse(
			( response ) =>
				response.url().includes( '/post.php' ) &&
				response.status() === 200
		);
	} );

	await test.step( `Wait for the loading overlay to disappear.`, async () => {
		await expect( page.locator( '.blockOverlay' ) ).toBeHidden();
	} );
}

test( 'can add custom product attributes', async ( { page, product } ) => {
	await test.step( `Open "Edit product" page of product id ${ product.id }`, async () => {
		await page.goto( `wp-admin/post.php?post=${ product.id }&action=edit` );
		await toggleVariableProductTour( page, false );
	} );

	await goToAttributesTab( page );

	for ( let i = 0; i < productAttributes.length; i++ ) {
		const attributeName = productAttributes[ i ].name;
		const attributeValues = productAttributes[ i ].options.join( ' | ' );

		await test.step( `Add the attribute "${ attributeName }" with values "${ attributeValues }"`, async () => {
			await addAttribute( page, attributeName, attributeValues, i === 0 );
		} );
	}

	await test.step( 'Update product', async () => {
		// "Update" triggers a lot of requests. Wait for the final one to complete before proceeding.
		// Otherwise, succeeding steps would be flaky.
		const finalRequestResolution = page.waitForResponse( ( response ) =>
			response.url().includes( 'options' )
		);
		await page
			.locator( '#publishing-action' )
			.getByRole( 'button', { name: 'Update' } )
			.click();

		await finalRequestResolution;
	} );

	await goToAttributesTab( page );

	for ( let j = 0; j < productAttributes.length; j++ ) {
		const attributeName = productAttributes[ j ].name;
		const attributeValues = productAttributes[ j ].options.join( ' | ' );

		await test.step( `Expect "${ attributeName }" to appear on the list of saved attributes, and expand it.`, async () => {
			await page
				.getByRole( 'heading', {
					name: attributeName,
				} )
				.last()
				.click();
		} );

		await test.step( `Expect its details to be saved correctly`, async () => {
			await expect(
				page.getByPlaceholder( 'e.g. length or weight' ).nth( j )
			).toHaveValue( attributeName );
			await expect(
				page
					.getByPlaceholder(
						'Enter options for customers to choose from'
					)
					.nth( j )
			).toHaveValue( attributeValues );
			await expect(
				page
					.getByText( 'Visible on the product page' )
					.getByRole( 'checkbox' )
					.nth( j )
			).toBeChecked();
			await expect(
				page
					.getByText( 'Used for variations' )
					.getByRole( 'checkbox' )
					.nth( j )
			).toBeChecked();
		} );
	}
} );
