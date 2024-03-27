<?php

namespace Automattic\WooCommerce\Admin\Features;

use Automattic\WooCommerce\Admin\PageController;

/**
 * Takes care of Launch Your Store related actions.
 */
class LaunchYourStore {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'woocommerce_update_options_general', array( $this, 'save_site_visibility_options' ) );
		add_action( 'current_screen', array( $this, 'maybe_create_coming_soon_page' ) );
		add_filter( 'woocommerce_admin_shared_settings', array( $this, 'preload_settings' ) );
	}

	/**
	 * Save values submitted from WooCommerce -> Settings -> General.
	 *
	 * @return void
	 */
	public function save_site_visibility_options() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( empty( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( wp_unslash( $_REQUEST['_wpnonce'] ), 'woocommerce-settings' ) ) {
			return;
		}

		$options = array(
			'woocommerce_coming_soon'      => array( 'yes', 'no' ),
			'woocommerce_store_pages_only' => array( 'yes', 'no' ),
			'woocommerce_private_link'     => array( 'yes', 'no' ),
		);

		foreach ( $options as $name => $option ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			if ( isset( $_POST[ $name ] ) && in_array( $_POST[ $name ], $option, true ) ) {
				// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				update_option( $name, wp_unslash( $_POST[ $name ] ) );
			}
		}
	}

	public function get_coming_soon_content() {
		return '<!-- wp:group {"layout":{"type":"constrained"}} -->
		<div class="wp-block-group"><!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->
		
		<!-- wp:heading {"textAlign":"center","level":1} -->
		<h1 class="wp-block-heading has-text-align-center">Great things coming soon</h1>
		<!-- /wp:heading -->
		
		<!-- wp:spacer {"height":"10px"} -->
		<div style="height:10px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer -->
		
		<!-- wp:paragraph {"align":"center"} -->
		<p class="has-text-align-center">Something big is brewing! Our store is in the works - Launching shortly!</p>
		<!-- /wp:paragraph -->
		
		<!-- wp:spacer -->
		<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
		<!-- /wp:spacer --></div>
		<!-- /wp:group -->';
	}

	/**
	 * Add `coming soon` page when it hasn't been created yet.
	 *
	 * @param WP_Screen $current_screen Current screen object.
	 *
	 * @return void
	 */
	public function maybe_create_coming_soon_page( $current_screen ) {
		$option_name    = 'woocommerce_coming_soon_page_id';
		$current_page   = PageController::get_instance()->get_current_page();
		$is_home        = isset( $current_page['id'] ) && 'woocommerce-home' === $current_page['id'];
		$page_id_option = get_option( $option_name, false );
		if ( $current_screen && 'woocommerce_page_wc-admin' === $current_screen->id && $is_home && ! $page_id_option ) {
			$page_id = wc_create_page(
				esc_sql( _x( 'Coming Soon', 'Page slug', 'woocommerce' ) ),
				$option_name,
				_x( 'Coming Soon', 'Page title', 'woocommerce' ),
				$this->get_coming_soon_content(),
			);
			// Make sure the page uses the no-title template.
			update_post_meta( $page_id, '_wp_page_template', 'page-no-title' );
			// wc_create_page doesn't create options with autoload = yes.
			// Since we'll querying the option on WooCommerce home,
			// we should update the option to set autoload to yes.
			$page_id_option = get_option( $option_name );
			update_option( $option_name, $page_id_option, true );
		}
	}

	/**
	 * Preload settings for Site Visibility.
	 *
	 * @param array $settings settings array.
	 *
	 * @return mixed
	 */
	public function preload_settings( $settings ) {
		if ( ! is_admin() ) {
			return $settings;
		}

		$current_screen  = get_current_screen();
		$is_setting_page = $current_screen && 'woocommerce_page_wc-settings' === $current_screen->id;

		if ( $is_setting_page ) {
			$settings['siteVisibilitySettings'] = array(
				'shop_permalink'               => get_permalink( wc_get_page_id( 'shop' ) ),
				'woocommerce_coming_soon'      => get_option( 'woocommerce_coming_soon' ),
				'woocommerce_store_pages_only' => get_option( 'woocommerce_store_pages_only' ),
				'woocommerce_private_link'     => get_option( 'woocommerce_private_link' ),
				'woocommerce_share_key'        => get_option( 'woocommerce_share_key' ),
			);
		}

		return $settings;
	}
}
