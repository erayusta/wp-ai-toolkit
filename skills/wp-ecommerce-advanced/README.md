# WP eCommerce Advanced

> Build with WooCommerce Subscriptions, Bookings, marketplaces, and Easy Digital Downloads

## What This Skill Covers

- Implementing WooCommerce Subscriptions with custom billing schedules
- Setting up WooCommerce Bookings for appointments and reservations
- Building multi-vendor marketplaces with Dokan or WCFM
- Configuring Easy Digital Downloads for software licensing

## Example Usage

Ask your AI assistant:

```
> "Add a custom subscription renewal discount for loyal customers on wordpress.test"
```

### Example Output

```php
// Apply 15% discount on subscription renewals after 6 months
add_filter( 'wcs_renewal_order_created', 'apply_loyalty_renewal_discount', 10, 2 );

function apply_loyalty_renewal_discount( $renewal_order, $subscription ) {
    $start_date    = $subscription->get_date( 'start' );
    $months_active = ( time() - strtotime( $start_date ) ) / MONTH_IN_SECONDS;

    if ( $months_active < 6 ) {
        return $renewal_order;
    }

    $discount_rate = 0.15;

    foreach ( $renewal_order->get_items() as $item ) {
        $original_total = (float) $item->get_total();
        $discounted     = $original_total * ( 1 - $discount_rate );

        $item->set_total( $discounted );
        $item->set_subtotal( $discounted );
        $item->save();
    }

    $renewal_order->add_order_note(
        sprintf( 'Loyalty discount of %d%% applied (customer active %d months).', $discount_rate * 100, (int) $months_active )
    );

    $renewal_order->calculate_totals();
    return $renewal_order;
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_woocommerce` | Inspects WooCommerce hooks and data structures |
| `validate_php` | Checks subscription and order manipulation code |
| `run_wp_cli` | Manages WooCommerce products and subscriptions |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
