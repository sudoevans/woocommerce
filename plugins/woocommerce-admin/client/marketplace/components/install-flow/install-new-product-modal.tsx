/**
 * External dependencies
 */
import { ButtonGroup, Button, Modal, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { dispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { navigateTo, getNewPath, useQuery } from '@woocommerce/navigation';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import ProductCard from '~/marketplace/components/product-card/product-card';
import { Product } from '~/marketplace/components/product-list/types';
import { installingStore } from '~/marketplace/contexts/install-store';
import { downloadProduct } from '~/marketplace/utils/functions';
import { createOrder } from './create-order';
import { Subscription } from '../my-subscriptions/types';
import { getAdminSetting } from '~/utils/admin-settings';
import {
	MARKETPLACE_PATH,
	WP_ADMIN_PLUGIN_LIST_URL,
} from '~/marketplace/components/constants';
import ConnectAccountButton from '~/marketplace/components/my-subscriptions/table/actions/connect-account-button';

enum InstallFlowStatus {
	'notConnected',
	'notInstalled',
	'installing',
	'installedCanActivate',
	'installedCannotActivate',
	'installFailed',
	'activating',
	'activated',
	'activationFailed',
}

function InstallNewProductModal( props: { products: Product[] } ) {
	const [ installStatus, setInstallStatus ] = useState< InstallFlowStatus >(
		InstallFlowStatus.notInstalled
	);
	const [ subscription, setSubscription ] = useState< Subscription >();
	const [ product, setProduct ] = useState< Product >();
	const [ installedProducts, setInstalledProducts ] = useState< string[] >();
	const [ activateUrl, setActivateUrl ] = useState< string >();
	const [ showModal, setShowModal ] = useState< boolean >( false );
	const [ notice, setNotice ] = useState< {
		message: string;
		status: 'warning' | 'error' | 'success' | 'info';
	} >();

	const query = useQuery();

	// Check if the store is connected to Woo.com. This is run once, when the component is mounted.
	useEffect( () => {
		const wccomSettings = getAdminSetting( 'wccomHelper', {} );
		const isStoreConnected = wccomSettings?.isConnected;

		setInstalledProducts( wccomSettings?.installedProducts );

		if ( isStoreConnected === false ) {
			setInstallStatus( InstallFlowStatus.notConnected );
			setNotice( {
				status: 'warning',
				message: __(
					'In order to install a product, you need to first connect your account.',
					'woocommerce'
				),
			} );
		} else {
			setInstallStatus( InstallFlowStatus.notInstalled );
		}
	}, [] );

	/**
	 * Listen for changes in the query, and show the modal if the installProduct query param is set.
	 * If it's set, try to find the product in the products prop. We need it to be able to
	 * display title, icon and send product ID to Woo.com to create an order.
	 */
	useEffect( () => {
		setShowModal( false );
		if ( ! query.installProduct ) {
			return;
		}

		const productId = parseInt( query.installProduct, 10 );

		/**
		 * Try to find the product in the search results. We need to product to be able to
		 * show the title and the icon.
		 */
		const productToInstall = props.products.find(
			( item ) => item.id === productId
		);

		if ( ! productToInstall ) {
			return;
		}

		if ( installedProducts ) {
			const isInstalled = !! installedProducts.find(
				( item ) => item === productToInstall.slug
			);

			if ( isInstalled ) {
				return;
			}
		}

		setShowModal( true );
		setProduct( productToInstall );
	}, [ query, props.products, installedProducts ] );

	function activateClick() {
		if ( ! activateUrl ) {
			return;
		}

		setInstallStatus( InstallFlowStatus.activating );

		recordEvent( 'marketplace_activate_new_product_clicked', {
			product_id: product ? product.id : 0,
		} );

		fetch( activateUrl )
			.then( () => {
				setInstallStatus( InstallFlowStatus.activated );
			} )
			.catch( () => {
				setInstallStatus( InstallFlowStatus.activationFailed );
				setNotice( {
					status: 'error',
					message: __(
						'Activation failed. Please try again from the plugins page.',
						'woocommerce'
					),
				} );
			} );
	}

	function orderAndInstall() {
		if ( ! product || ! product.id ) {
			return;
		}

		recordEvent( 'marketplace_install_new_product_clicked', {
			product_id: product.id,
		} );

		setInstallStatus( InstallFlowStatus.installing );

		createOrder( product.id )
			.then( ( response ) => {
				// This narrows the CreateOrderResponse type to CreateOrderSuccessResponse
				if ( ! response.success ) {
					throw response;
				}

				const subscriptionData = response.data;

				setSubscription( subscriptionData );

				dispatch( installingStore ).startInstalling(
					subscriptionData.product_key
				);

				return downloadProduct( subscriptionData ).then(
					( downloadResponse ) => {
						dispatch( installingStore ).stopInstalling(
							subscriptionData.product_key
						);

						if ( downloadResponse.data.activateUrl ) {
							setActivateUrl( downloadResponse.data.activateUrl );

							setInstallStatus(
								InstallFlowStatus.installedCanActivate
							);
						} else {
							setInstallStatus(
								InstallFlowStatus.installedCannotActivate
							);
						}
					}
				);
			} )
			.catch( ( error ) => {
				/**
				 * apiFetch doesn't return the error code in the error condition.
				 * We'll rely on the data returned by the server.
				 */
				if ( error.data.redirect_location ) {
					setNotice( {
						status: 'info',
						message: __(
							'Missing information. Redirecting to Woo.com to continue the installation.',
							'woocommerce'
						),
					} );

					window.location.href = error.data.redirect_location;
				} else {
					setInstallStatus( InstallFlowStatus.installFailed );
					setNotice( {
						status: 'error',
						message: error.data.message,
					} );
				}
			} );
	}

	function onClose() {
		navigateTo( {
			url: getNewPath(
				{
					...query,
					install: undefined,
					installProduct: undefined,
				},
				MARKETPLACE_PATH,
				{}
			),
		} );
	}

	function getTitle(): string {
		if ( installStatus === InstallFlowStatus.activated ) {
			return __( 'You are ready to go!', 'woocommerce' );
		}

		return __( 'Add to Store', 'woocommerce' );
	}

	function getDescription(): string {
		if ( installStatus === InstallFlowStatus.notConnected ) {
			return '';
		}

		if (
			installStatus === InstallFlowStatus.installedCanActivate ||
			installStatus === InstallFlowStatus.activating
		) {
			return __(
				'Extension successfully installed. Would you like to activate it?',
				'woocommerce'
			);
		}

		if ( installStatus === InstallFlowStatus.installedCannotActivate ) {
			return __(
				'Extension successfully installed. Keep the momentum going and start setting up your extension.',
				'woocommerce'
			);
		}

		if ( installStatus === InstallFlowStatus.activated ) {
			return __(
				'Keep the momentum going and start setting up your extension.',
				'woocommerce'
			);
		}

		return __( 'Would you like to install this extension?', 'woocommerce' );
	}

	function secondaryButton(): React.ReactElement {
		if ( installStatus === InstallFlowStatus.activated ) {
			if ( subscription?.documentation_url ) {
				return (
					<Button
						variant="tertiary"
						href={ subscription.documentation_url }
						className="woocommerce-marketplace__header-account-modal-button"
						key={ 'docs' }
					>
						{ __( 'View Docs', 'woocommerce' ) }
					</Button>
				);
			}

			return <></>;
		}

		return (
			<Button
				variant="tertiary"
				onClick={ onClose }
				className="woocommerce-marketplace__header-account-modal-button"
				key={ 'cancel' }
			>
				{ __( 'Cancel', 'woocommerce' ) }
			</Button>
		);
	}

	function primaryButton(): React.ReactElement {
		if ( installStatus === InstallFlowStatus.notConnected ) {
			return <ConnectAccountButton variant="primary" key={ 'connect' } />;
		}

		if (
			installStatus === InstallFlowStatus.installedCanActivate ||
			installStatus === InstallFlowStatus.activating
		) {
			return (
				<Button
					variant="primary"
					onClick={ activateClick }
					key={ 'activate' }
					isBusy={ installStatus === InstallFlowStatus.activating }
					disabled={ installStatus === InstallFlowStatus.activating }
				>
					{ __( 'Activate', 'woocommerce' ) }
				</Button>
			);
		}

		if (
			installStatus === InstallFlowStatus.activated ||
			installStatus === InstallFlowStatus.installedCannotActivate ||
			installStatus === InstallFlowStatus.activationFailed
		) {
			return (
				<Button
					variant="primary"
					href={ WP_ADMIN_PLUGIN_LIST_URL }
					className="woocommerce-marketplace__header-account-modal-button"
					key={ 'plugin-list' }
				>
					{ __( 'View in Plugins', 'woocommerce' ) }
				</Button>
			);
		}

		return (
			<Button
				variant="primary"
				onClick={ orderAndInstall }
				key={ 'install' }
				isBusy={ installStatus === InstallFlowStatus.installing }
				disabled={ installStatus === InstallFlowStatus.installing }
			>
				{ __( 'Install', 'woocommerce' ) }
			</Button>
		);
	}

	/**
	 * Actually, just checking showModal is enough here. However, checking
	 * for the product narrows the type from "Product | undefined"
	 * to "Product".
	 */
	if ( ! product || ! showModal ) {
		return <></>;
	}

	return (
		<Modal
			title={ getTitle() }
			onRequestClose={ onClose }
			focusOnMount={ true }
			className="woocommerce-marketplace__header-account-modal has-size-medium"
			style={ { borderRadius: 4 } }
			overlayClassName="woocommerce-marketplace__header-account-modal-overlay"
		>
			<p className="woocommerce-marketplace__header-account-modal-text">
				{ getDescription() }
			</p>
			{ product && (
				<ProductCard
					product={ product }
					small={ true }
					tracksData={ {
						position: 1,
						group: 'install-flow',
						label: 'install',
					} }
				/>
			) }
			{ notice && (
				<Notice status={ notice.status } isDismissible={ false }>
					{ notice.message }
				</Notice>
			) }

			<ButtonGroup className="woocommerce-marketplace__header-account-modal-button-group">
				{ secondaryButton() }
				{ primaryButton() }
			</ButtonGroup>
		</Modal>
	);
}

export default InstallNewProductModal;