# WordPress E-Commerce Advanced — Agent Skill

You are an expert in advanced WordPress e-commerce: WooCommerce Subscriptions, Bookings, memberships, marketplaces, multi-vendor, EDD, cart/checkout customization, and payment integrations.

## WooCommerce Subscriptions

```php
// Check if product is a subscription
if (WC_Subscriptions_Product::is_subscription($product)) {
    $period   = WC_Subscriptions_Product::get_period($product);    // 'month', 'year'
    $interval = WC_Subscriptions_Product::get_interval($product);  // 1, 2, 3...
    $length   = WC_Subscriptions_Product::get_length($product);    // 0 = unlimited
    $trial    = WC_Subscriptions_Product::get_trial_length($product);
}

// Subscription lifecycle hooks
add_action('woocommerce_subscription_status_active', function ($subscription) {
    $user_id = $subscription->get_user_id();
    update_user_meta($user_id, '_premium_member', 'yes');
});

add_action('woocommerce_subscription_status_cancelled', function ($subscription) {
    $user_id = $subscription->get_user_id();
    delete_user_meta($user_id, '_premium_member');
});

add_action('woocommerce_subscription_renewal_payment_complete', function ($subscription, $last_order) {
    // Runs after each successful renewal payment
    do_action('myplugin_subscription_renewed', $subscription->get_user_id());
}, 10, 2);

// Query active subscriptions
$subscriptions = wcs_get_subscriptions([
    'subscriptions_per_page' => -1,
    'subscription_status'    => 'active',
    'customer_id'            => $user_id,
]);
```

## Cart & Checkout Customization

```php
// Add custom checkout field
add_action('woocommerce_after_order_notes', function ($checkout) {
    woocommerce_form_field('delivery_notes', [
        'type'        => 'textarea',
        'class'       => ['form-row-wide'],
        'label'       => __('Delivery Notes', 'my-plugin'),
        'placeholder' => __('Special delivery instructions...', 'my-plugin'),
    ], $checkout->get_value('delivery_notes'));
});

// Validate custom field
add_action('woocommerce_checkout_process', function () {
    if (isset($_POST['delivery_notes']) && strlen($_POST['delivery_notes']) > 500) {
        wc_add_notice(__('Delivery notes too long (max 500 chars).', 'my-plugin'), 'error');
    }
});

// Save custom field to order
add_action('woocommerce_checkout_update_order_meta', function ($order_id) {
    if (!empty($_POST['delivery_notes'])) {
        update_post_meta($order_id, '_delivery_notes', sanitize_textarea_field($_POST['delivery_notes']));
    }
});

// Add fees dynamically
add_action('woocommerce_cart_calculate_fees', function ($cart) {
    if (is_admin() && !defined('DOING_AJAX')) return;

    $total = $cart->get_subtotal();
    if ($total > 500) {
        $cart->add_fee(__('Bulk Discount', 'my-plugin'), -($total * 0.1)); // 10% discount
    }

    // Gift wrapping
    if (WC()->session->get('gift_wrap')) {
        $cart->add_fee(__('Gift Wrapping', 'my-plugin'), 5.99);
    }
});

// Modify cart item price display
add_filter('woocommerce_cart_item_price', function ($price, $cart_item) {
    $product = $cart_item['data'];
    if ($product->is_on_sale()) {
        $price .= ' <del>' . wc_price($product->get_regular_price()) . '</del>';
    }
    return $price;
}, 10, 2);

// Free shipping over threshold
add_filter('woocommerce_package_rates', function ($rates, $package) {
    $threshold = 75;
    $subtotal = WC()->cart->get_subtotal();

    if ($subtotal >= $threshold) {
        foreach ($rates as $rate_id => $rate) {
            if ($rate->method_id !== 'free_shipping') {
                unset($rates[$rate_id]); // Remove paid shipping options
            }
        }
    }
    return $rates;
}, 10, 2);
```

## Custom Product Types

```php
// Register a custom product type (e.g., "Rental")
class WC_Product_Rental extends WC_Product {
    public function get_type() { return 'rental'; }

    public function __construct($product = 0) {
        parent::__construct($product);
    }
}

// Register with WooCommerce
add_filter('product_type_selector', function ($types) {
    $types['rental'] = __('Rental Product', 'my-plugin');
    return $types;
});

add_filter('woocommerce_product_class', function ($classname, $product_type) {
    if ($product_type === 'rental') return 'WC_Product_Rental';
    return $classname;
}, 10, 2);

// Add custom tab for rental-specific data
add_filter('woocommerce_product_data_tabs', function ($tabs) {
    $tabs['rental'] = [
        'label'    => __('Rental Options', 'my-plugin'),
        'target'   => 'rental_product_data',
        'class'    => ['show_if_rental'],
        'priority' => 21,
    ];
    return $tabs;
});

add_action('woocommerce_product_data_panels', function () {
    echo '<div id="rental_product_data" class="panel">';
    woocommerce_wp_text_input(['id' => '_rental_daily_rate', 'label' => 'Daily Rate', 'type' => 'number']);
    woocommerce_wp_text_input(['id' => '_rental_min_days', 'label' => 'Minimum Days', 'type' => 'number']);
    woocommerce_wp_text_input(['id' => '_rental_deposit', 'label' => 'Security Deposit', 'type' => 'number']);
    echo '</div>';
});
```

## Multi-Vendor / Marketplace

```php
// Dokan hooks for multi-vendor stores
add_action('dokan_new_product_added', function ($product_id, $data) {
    // Run when a vendor adds a new product
    wp_mail(get_option('admin_email'), 'New vendor product', "Product #{$product_id} needs review.");
}, 10, 2);

// Custom vendor commission
add_filter('dokan_get_seller_percentage', function ($commission, $product_id, $seller_id) {
    // VIP vendors get better rates
    if (get_user_meta($seller_id, '_vip_vendor', true) === 'yes') {
        return 90; // 90% to vendor, 10% to marketplace
    }
    return $commission;
}, 10, 3);
```

## Easy Digital Downloads

```php
// EDD custom purchase actions
add_action('edd_complete_purchase', function ($payment_id) {
    $payment = new EDD_Payment($payment_id);
    $email   = $payment->email;
    $items   = $payment->downloads;

    foreach ($items as $item) {
        // Grant access, send license, etc.
        myplugin_activate_license($email, $item['id']);
    }
});

// Custom EDD shortcode
add_shortcode('product_price', function ($atts) {
    $atts = shortcode_atts(['id' => 0], $atts);
    if (!$atts['id']) return '';
    return edd_price($atts['id'], false);
});
```

## Order Workflow Automation

```php
// Auto-complete virtual orders
add_action('woocommerce_thankyou', function ($order_id) {
    $order = wc_get_order($order_id);
    $virtual = true;

    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        if (!$product->is_virtual()) { $virtual = false; break; }
    }

    if ($virtual && $order->get_status() === 'processing') {
        $order->update_status('completed', __('Auto-completed: all items virtual.', 'my-plugin'));
    }
});

// Custom order status
register_post_status('wc-awaiting-pickup', [
    'label'                     => _x('Awaiting Pickup', 'Order status', 'my-plugin'),
    'public'                    => true,
    'show_in_admin_status_list' => true,
    'show_in_admin_all_list'    => true,
    'exclude_from_search'       => false,
    'label_count'               => _n_noop('Awaiting Pickup (%s)', 'Awaiting Pickup (%s)', 'my-plugin'),
]);

add_filter('wc_order_statuses', function ($statuses) {
    $statuses['wc-awaiting-pickup'] = _x('Awaiting Pickup', 'Order status', 'my-plugin');
    return $statuses;
});
```

## Best Practices

1. **Use WC CRUD methods** — `$order->get_*()`, `$product->get_*()`, never direct meta
2. **Declare HPOS compatibility** — required for all WooCommerce extensions
3. **Test with WC beta** — use beta tester plugin before major releases
4. **Use Action Scheduler** — for background order processing, not WP-Cron
5. **Handle currency properly** — `wc_price()` for display, raw numbers for logic
6. **Check `is_admin() && !DOING_AJAX`** — before modifying cart on admin pages
7. **Use `wc_add_notice()`** — for user-facing messages, not `wp_die()`
8. **Hook priorities** — WC default is 10; use 20+ to override
9. **Custom order statuses** — always register with `register_post_status()`
10. **Validate checkout server-side** — never trust frontend validation alone
