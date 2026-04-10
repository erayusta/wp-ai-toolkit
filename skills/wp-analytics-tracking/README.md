# WP Analytics & Tracking

> Integrate GA4, GTM, Google Search Console, event tracking, and UTM campaigns

## What This Skill Covers

- Setting up GA4 measurement ID and data streams in WordPress
- Configuring Google Tag Manager containers and triggers
- Implementing custom event tracking for user interactions
- Managing UTM parameters for campaign attribution

## Example Usage

Ask your AI assistant:

```
> "Add GA4 event tracking for WooCommerce add-to-cart buttons on wordpress.test"
```

### Example Output

```php
add_action( 'wp_footer', 'track_add_to_cart_events' );

function track_add_to_cart_events() {
    if ( ! is_shop() && ! is_product() ) {
        return;
    }
    ?>
    <script>
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.add_to_cart_button, .single_add_to_cart_button');
        if (!btn) return;

        const productName = btn.closest('.product')?.querySelector('.woocommerce-loop-product__title')?.textContent
            || document.querySelector('.product_title')?.textContent || 'Unknown';

        gtag('event', 'add_to_cart', {
            currency: '<?php echo esc_js( get_woocommerce_currency() ); ?>',
            item_name: productName,
            event_category: 'ecommerce'
        });
    });
    </script>
    <?php
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_seo` | Audits tracking code placement and data layer |
| `validate_php` | Ensures correct hook usage for script injection |
| `check_performance` | Verifies analytics scripts don't block rendering |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
