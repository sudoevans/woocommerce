<?php
/**
 * Title: Banner
 * Slug: woocommerce-blocks/banner
 * Categories: WooCommerce
 */
?>
<!-- wp:group {"align":"wide","style":{"color":{"background":"#f9eddb","text":"#443127"},"spacing":{"padding":{"right":"50px","bottom":"50px","left":"50px","top":"50px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide has-text-color has-background" style="color:#443127;background-color:#f9eddb;padding-top:50px;padding-right:50px;padding-bottom:50px;padding-left:50px"><!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column {"style":{"spacing":{"padding":{"left":"110px"}}}} -->
<div class="wp-block-column" style="padding-left:110px"><!-- wp:group {"style":{"spacing":{"padding":{"top":"0","right":"0","left":"0"}}},"layout":{"type":"constrained","wideSize":"360px","justifyContent":"left"}} -->
<div class="wp-block-group" style="padding-top:0;padding-right:0;padding-left:0"><!-- wp:paragraph {"style":{"color":{"text":"#c85643"},"typography":{"fontSize":"18px"},"spacing":{"margin":{"top":"0","right":"0","bottom":"0","left":"0"}}}} -->
<p class="has-text-color" style="color:#c85643;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;font-size:18px"><strong>HOLIDAY SALE</strong></p>
<!-- /wp:paragraph -->

<!-- wp:columns {"verticalAlignment":null,"align":"wide","style":{"color":{"background":"#caf0fa"}}} -->
<div class="wp-block-columns alignwide has-background" style="background-color:#caf0fa">
	<!-- wp:column {"verticalAlignment":"center","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","right":"var:preset|spacing|60","bottom":"var:preset|spacing|30","left":"var:preset|spacing|60"}}}} -->
	<div class="wp-block-column is-vertically-aligned-center" style="padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--60)">
		<!-- wp:paragraph {"style":{"color":{"text":"#005cc9"},"typography":{"fontSize":"18px"},"spacing":{"margin":{"top":"0","right":"0","bottom":"0","left":"0"}}}} -->
		<p class="has-text-color" style="color:#005cc9;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;font-size:18px"><strong>HOLIDAY SALE</strong> </p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"style":{"typography":{"fontSize":"48px"},"color":{"text":"#043553"},"spacing":{"margin":{"top":"0px","right":"0px","bottom":"0px","left":"0px"},"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}}} -->
		<p class="has-text-color" style="color:#043553;margin-top:0px;margin-right:0px;margin-bottom:0px;margin-left:0px;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:48px"><strong>Save up to 60%</strong> </p>
		<!-- /wp:paragraph -->

<!-- wp:buttons {"style":{"spacing":{"blockGap":"0","margin":{"top":"20px","bottom":"0"}}}} -->
<div class="wp-block-buttons" style="margin-top:20px;margin-bottom:0"><!-- wp:button {"style":{"typography":{"fontSize":"16px"},"color":{"text":"#000000","background":"#ffffff"},"border":{"width":"0px","style":"none"}},"className":"is-style-fill"} -->
<div class="wp-block-button has-custom-font-size is-style-fill" style="font-size:16px"><a href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>" class="wp-block-button__link has-text-color has-background wp-element-button" style="border-style:none;border-width:0px;color:#000000;background-color:#ffffff">Shop Holiday Sales</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center"><!-- wp:image {"id":1,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="<?php echo esc_url( plugins_url( 'images/pattern-placeholders/wood-home-wall-decoration-shelf-living-room.png', dirname( __FILE__ ) ) ); ?>" alt="<?php esc_attr_e( 'Placeholder image used to represent products being showcased in a banner.', 'woo-gutenberg-products-block' ); ?>" class="wp-image-1"/></figure>
<!-- /wp:image --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->