/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { getSetting } from '@woocommerce/settings';

/**
 * Internal dependencies
 */
import formStepAttributes from '../../form-step/attributes';

const defaultTitle = getSetting( 'localPickupEnabled', false )
	? __( 'Shipping address', 'woocommerce' )
	: __( 'Delivery', 'woocommerce' );

export default {
	...formStepAttributes( {
		defaultTitle,
		defaultDescription: __(
			'Enter the address where you want your order delivered.',
			'woocommerce'
		),
	} ),
	className: {
		type: 'string',
		default: '',
	},
	lock: {
		type: 'object',
		default: {
			move: true,
			remove: true,
		},
	},
};
