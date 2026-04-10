# WordPress Analytics & Tracking — Agent Skill

You are an expert in WordPress analytics setup: Google Analytics 4, Google Search Console, event tracking, UTM parameters, and conversion tracking.

## GA4 Setup in WordPress

### Option 1: Google Site Kit Plugin (Recommended)
```bash
wp plugin install google-site-kit --activate
# Then connect via WordPress Admin > Site Kit > Setup
```

### Option 2: Manual (via functions.php or plugin)
```php
add_action('wp_head', function () {
    $ga4_id = get_option('myplugin_ga4_id', '');
    if (empty($ga4_id)) return;
    ?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr($ga4_id); ?>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<?php echo esc_js($ga4_id); ?>');
    </script>
    <?php
}, 1);
```

### Option 3: Google Tag Manager
```php
// Head tag (as early as possible)
add_action('wp_head', function () {
    $gtm_id = 'GTM-XXXXXXX';
    ?>
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','<?php echo esc_js($gtm_id); ?>');</script>
    <?php
}, 1);

// Body tag (immediately after <body>)
add_action('wp_body_open', function () {
    $gtm_id = 'GTM-XXXXXXX';
    ?>
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo esc_attr($gtm_id); ?>"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <?php
});
```

## Custom Event Tracking

### GA4 Events in WordPress
```php
// Track form submissions
add_action('wp_footer', function () {
    ?>
    <script>
    document.querySelectorAll('form.contact-form').forEach(function(form) {
        form.addEventListener('submit', function() {
            gtag('event', 'form_submit', {
                form_name: this.getAttribute('data-form-name') || 'contact',
                page_location: window.location.href
            });
        });
    });

    // Track CTA clicks
    document.querySelectorAll('.cta-button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            gtag('event', 'cta_click', {
                cta_text: this.textContent.trim(),
                cta_location: this.closest('section')?.className || 'unknown',
                page_location: window.location.href
            });
        });
    });

    // Track scroll depth
    var scrollMarkers = [25, 50, 75, 100];
    var scrollFired = {};
    window.addEventListener('scroll', function() {
        var scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        scrollMarkers.forEach(function(marker) {
            if (scrollPercent >= marker && !scrollFired[marker]) {
                scrollFired[marker] = true;
                gtag('event', 'scroll_depth', { percent: marker });
            }
        });
    });
    </script>
    <?php
});
```

### WooCommerce Enhanced E-commerce
```php
// Track product views
add_action('woocommerce_after_single_product', function () {
    global $product;
    ?>
    <script>
    gtag('event', 'view_item', {
        currency: '<?php echo esc_js(get_woocommerce_currency()); ?>',
        value: <?php echo floatval($product->get_price()); ?>,
        items: [{
            item_id: '<?php echo esc_js($product->get_sku()); ?>',
            item_name: '<?php echo esc_js($product->get_name()); ?>',
            price: <?php echo floatval($product->get_price()); ?>
        }]
    });
    </script>
    <?php
});

// Track add to cart
add_action('wp_footer', function () {
    if (!is_product()) return;
    ?>
    <script>
    jQuery(document.body).on('added_to_cart', function(e, fragments, hash, btn) {
        gtag('event', 'add_to_cart', {
            currency: woocommerce_params.currency,
            items: [{ item_name: btn.data('product_name') || 'product' }]
        });
    });
    </script>
    <?php
});
```

## UTM Parameters

### Standard UTM Tags
| Parameter | Purpose | Example |
|:----------|:--------|:--------|
| `utm_source` | Traffic source | google, facebook, newsletter |
| `utm_medium` | Marketing medium | cpc, email, social, organic |
| `utm_campaign` | Campaign name | spring_sale, product_launch |
| `utm_term` | Paid keyword | wordpress+hosting |
| `utm_content` | Ad variation | hero_cta, sidebar_banner |

### URL Builder
```
https://example.com/landing-page/
  ?utm_source=facebook
  &utm_medium=paid
  &utm_campaign=black_friday_2025
  &utm_content=carousel_ad_v2
```

### Track UTM in WordPress
```php
// Save UTM params to cookie on first visit
add_action('init', function () {
    $utm_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    foreach ($utm_params as $param) {
        if (isset($_GET[$param])) {
            setcookie("wp_{$param}", sanitize_text_field($_GET[$param]), time() + (30 * DAY_IN_SECONDS), '/');
        }
    }
});

// Append UTM to form submissions
add_filter('wpcf7_form_hidden_fields', function ($fields) {
    $utm_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    foreach ($utm_params as $param) {
        $fields[$param] = sanitize_text_field($_COOKIE["wp_{$param}"] ?? '');
    }
    return $fields;
});
```

## Google Search Console Integration

### Verify Site Ownership
```php
// Option 1: HTML meta tag
add_action('wp_head', function () {
    echo '<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />';
});

// Option 2: via DNS TXT record (recommended)
// Add TXT record: google-site-verification=YOUR_CODE
```

### Monitor Key Metrics
| Metric | What It Tells You | Action If Low |
|:-------|:-----------------|:--------------|
| **Impressions** | How often pages appear in search | Improve keyword targeting |
| **Clicks** | How often users click through | Optimize titles & descriptions |
| **CTR** | Click-through rate | A/B test meta titles |
| **Position** | Average ranking | Improve content quality |
| **Coverage** | Index status | Fix crawl errors |
| **Core Web Vitals** | Page experience | Optimize performance |

## Conversion Tracking Setup

### GA4 Conversions (Key Events)
```javascript
// Track newsletter signup
gtag('event', 'sign_up', { method: 'newsletter' });

// Track purchase
gtag('event', 'purchase', {
    transaction_id: 'T12345',
    value: 49.99,
    currency: 'USD',
    items: [{ item_id: 'SKU123', item_name: 'Pro Plan', price: 49.99 }]
});

// Track lead form
gtag('event', 'generate_lead', {
    currency: 'USD',
    value: 50.00 // estimated lead value
});
```

### WordPress Conversion Pixels
```php
// Track WooCommerce purchase for Facebook Pixel
add_action('woocommerce_thankyou', function ($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;
    ?>
    <script>
    fbq('track', 'Purchase', {
        value: <?php echo floatval($order->get_total()); ?>,
        currency: '<?php echo esc_js($order->get_currency()); ?>',
        content_ids: <?php echo wp_json_encode(array_map(function($item) {
            return $item->get_product_id();
        }, $order->get_items())); ?>,
        content_type: 'product'
    });
    </script>
    <?php
});
```

## Data Layer for GTM

```php
add_action('wp_head', function () {
    $data = ['pageType' => 'other'];

    if (is_front_page()) $data['pageType'] = 'home';
    elseif (is_singular('post')) $data['pageType'] = 'blog_post';
    elseif (is_singular('page')) $data['pageType'] = 'page';
    elseif (is_archive()) $data['pageType'] = 'archive';
    elseif (is_search()) $data['pageType'] = 'search';

    if (is_user_logged_in()) {
        $data['userLoggedIn'] = true;
        $data['userRole'] = wp_get_current_user()->roles[0] ?? 'subscriber';
    }

    if (function_exists('is_product') && is_product()) {
        global $product;
        $data['pageType'] = 'product';
        $data['productName'] = $product->get_name();
        $data['productPrice'] = floatval($product->get_price());
        $data['productCategory'] = wp_get_post_terms($product->get_id(), 'product_cat', ['fields' => 'names'])[0] ?? '';
    }

    echo '<script>window.dataLayer = window.dataLayer || []; dataLayer.push(' . wp_json_encode($data) . ');</script>';
}, 1);
```

## Best Practices

1. **Use GTM over hardcoded tags** — easier to manage, no code deployments
2. **Set up GA4 key events** — mark form submissions, signups, purchases as conversions
3. **Track UTMs consistently** — create a naming convention and stick to it
4. **Use GA4 Debug View** — verify events fire correctly before going live
5. **Monitor Core Web Vitals** — in GSC, affects rankings
6. **Set up alerts** — GA4 custom insights for traffic drops
7. **Anonymize IP** — required by GDPR, enabled by default in GA4
8. **Cookie consent** — use a consent banner before loading tracking scripts (GDPR/CCPA)
9. **Cross-domain tracking** — configure in GA4 if you have multiple domains
10. **Regular audits** — check tracking monthly for broken events or missing data
