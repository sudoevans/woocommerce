/**
 * External dependencies
 */
import { resolveSelect, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

type LocationType = 'product' | 'archive' | 'cart' | 'order' | 'generic';
type Context< T > = T & {
	templateSlug?: string;
	postId?: number;
};
type SetEntityId = (
	kind: 'postType' | 'taxonomy',
	name: 'product' | 'product_cat' | 'product_tag',
	slug: string,
	stateSetter: ( entityId: number | null ) => void
) => void;

const templateSlugs = {
	singleProduct: 'single-product',
	productCategory: 'taxonomy-product_cat',
	productTag: 'taxonomy-product_tag',
	productAttribute: 'taxonomy-product_attribute',
	orderConfirmation: 'order-confirmation',
	cart: 'page-cart',
	checkout: 'page-checkout',
};

const getIdFromResponse = ( resp?: Record< 'id', number >[] ): number | null =>
	resp && resp.length && resp[ 0 ]?.id ? resp[ 0 ].id : null;

const setEntityId: SetEntityId = async ( kind, name, slug, stateSetter ) => {
	const response = ( await resolveSelect( coreStore ).getEntityRecords(
		kind,
		name,
		{
			_fields: [ 'id' ],
			slug,
		}
	) ) as Record< 'id', number >[];
	const entityId = getIdFromResponse( response );
	stateSetter( entityId );
};

const prepareGetEntitySlug =
	( templateSlug: string ) =>
	( entitySlug: string ): string =>
		templateSlug.replace( `${ entitySlug }-`, '' );
const prepareIsInSpecificTemplate =
	( templateSlug: string ) =>
	( entitySlug: string ): boolean =>
		templateSlug.includes( entitySlug ) && templateSlug !== entitySlug;
const prepareIsInGenericTemplate =
	( templateSlug: string ) =>
	( entitySlug: string ): boolean =>
		templateSlug === entitySlug;

const createLocationObject = ( type: LocationType, sourceData = {} ) => ( {
	type,
	sourceData,
} );

export const useGetLocation = < T, >(
	context: Context< T >,
	clientId: string
) => {
	const templateSlug = context.templateSlug || '';
	const postId = context.postId || null;

	const getEntitySlug = prepareGetEntitySlug( templateSlug );
	const isInSpecificTemplate = prepareIsInSpecificTemplate( templateSlug );

	// Detect Specific Templates
	const isInSpecificProductTemplate = isInSpecificTemplate(
		templateSlugs.singleProduct
	);
	const isInSpecificCategoryTemplate = isInSpecificTemplate(
		templateSlugs.productCategory
	);
	const isInSpecificTagTemplate = isInSpecificTemplate(
		templateSlugs.productTag
	);

	const [ productId, setProductId ] = useState< number | null >( null );
	const [ categoryId, setCategoryId ] = useState< number | null >( null );
	const [ tagId, setTagId ] = useState< number | null >( null );

	useEffect( () => {
		if ( isInSpecificProductTemplate ) {
			const slug = getEntitySlug( templateSlugs.singleProduct );
			setEntityId( 'postType', 'product', slug, setProductId );
		}

		if ( isInSpecificCategoryTemplate ) {
			const slug = getEntitySlug( templateSlugs.productCategory );
			setEntityId( 'taxonomy', 'product_cat', slug, setCategoryId );
		}

		if ( isInSpecificTagTemplate ) {
			const slug = getEntitySlug( templateSlugs.productTag );
			setEntityId( 'taxonomy', 'product_tag', slug, setTagId );
		}
	}, [
		isInSpecificProductTemplate,
		isInSpecificCategoryTemplate,
		isInSpecificTagTemplate,
		getEntitySlug,
	] );

	const { isInSingleProductBlock, isInMiniCartBlock } = useSelect(
		( select ) => ( {
			isInSingleProductBlock:
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore No types for this selector exist yet
				select( blockEditorStore ).getBlockParentsByBlockName(
					clientId,
					'woocommerce/single-product'
				).length > 0,
			isInMiniCartBlock:
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore No types for this selector exist yet
				select( blockEditorStore ).getBlockParentsByBlockName(
					clientId,
					'woocommerce/mini-cart-contents'
				).length > 0,
		} ),
		[ clientId ]
	);

	/**
	 * Case 1.1: SPECIFIC PRODUCT
	 * Single Product block - take product ID from context
	 */

	if ( isInSingleProductBlock ) {
		return createLocationObject( 'product', { productId: postId } );
	}

	/**
	 * Case 1.2: SPECIFIC PRODUCT
	 * Specific Single Product template - take product ID from taxononmy
	 */

	if ( isInSpecificProductTemplate ) {
		return createLocationObject( 'product', { productId } );
	}

	const isInGenericTemplate = prepareIsInGenericTemplate( templateSlug );

	/**
	 * Case 1.3: GENERIC PRODUCT
	 * Generic Single Product template
	 */

	const isInSingleProductTemplate = isInGenericTemplate(
		templateSlugs.singleProduct
	);

	if ( isInSingleProductTemplate ) {
		return createLocationObject( 'product', { productId: null } );
	}

	/**
	 * Case 2.1: SPECIFIC TAXONOMY
	 * Specific Category template - take category ID from
	 */

	if ( isInSpecificCategoryTemplate ) {
		return createLocationObject( 'archive', {
			taxonomy: 'product_cat',
			termId: categoryId,
		} );
	}

	/**
	 * Case 2.2: SPECIFIC TAXONOMY
	 * Specific Tag template
	 */

	if ( isInSpecificTagTemplate ) {
		return createLocationObject( 'archive', {
			taxonomy: 'product_tag',
			termId: tagId,
		} );
	}

	/**
	 * Case 2.3: GENERIC TAXONOMY
	 * Generic Taxonomy template
	 */

	const isInProductsByCategoryTemplate = isInGenericTemplate(
		templateSlugs.productCategory
	);

	if ( isInProductsByCategoryTemplate ) {
		return createLocationObject( 'archive', {
			taxonomy: 'product_cat',
			termId: null,
		} );
	}

	const isInProductsByTagTemplate = isInGenericTemplate(
		templateSlugs.productTag
	);

	if ( isInProductsByTagTemplate ) {
		return createLocationObject( 'archive', {
			taxonomy: 'product_tag',
			termId: null,
		} );
	}

	const isInProductsByAttributeTemplate = isInGenericTemplate(
		templateSlugs.productAttribute
	);

	if ( isInProductsByAttributeTemplate ) {
		return createLocationObject( 'archive', {
			taxonomy: null,
			termId: null,
		} );
	}

	/**
	 * Case 3: GENERIC CART
	 * Cart/Checkout templates or Mini Cart
	 */

	const isInCartContext =
		templateSlug === templateSlugs.cart ||
		templateSlug === templateSlugs.checkout ||
		isInMiniCartBlock;

	if ( isInCartContext ) {
		return createLocationObject( 'cart' );
	}

	/**
	 * Case 4: GENERIC ORDER
	 * Order Confirmation template
	 */

	const isInOrderTemplate = isInGenericTemplate(
		templateSlugs.orderConfirmation
	);

	if ( isInOrderTemplate ) {
		return createLocationObject( 'order' );
	}

	/**
	 * Case 5: GENERIC
	 * All other cases
	 */

	return createLocationObject( 'generic' );
};