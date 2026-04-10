# WP WooCommerce

> Work with product types, hooks, payment gateways, WC REST API, and HPOS

## What This Skill Covers

- Creating custom product types and product data tabs
- Using WooCommerce action and filter hooks for customization
- Building custom payment gateways with the WC_Payment_Gateway class
- Integrating with the WooCommerce REST API and HPOS storage

## Example Usage

Ask your AI assistant:

```
> "Add a custom product data tab and save extra fields in WooCommerce on wordpress.test"
```

### Example Output

```php
// Add custom product data tab
add_filter( 'woocommerce_product_data_tabs', 'add_warranty_tab' );

function add_warranty_tab( $tabs ) {
    $tabs['warranty'] = array(
        'label'    => __( 'Warranty', 'myplugin' ),
        'target'   => 'warranty_product_data',
        'class'    => array(),
        'priority' => 25,
    );
    return $tabs;
}

// Render tab content
add_action( 'woocommerce_product_data_panels', 'warranty_tab_content' );

function warranty_tab_content() {
    ?>
    <div id="warranty_product_data" class="panel woocommerce_options_panel">
        <?php
        woocommerce_wp_select( array(
            'id'      => '_warranty_period',
            'label'   => __( 'Warranty Period', 'myplugin' ),
            'options' => array(
                'none'     => __( 'No Warranty', 'myplugin' ),
                '6months'  => __( '6 Months', 'myplugin' ),
                '1year'    => __( '1 Year', 'myplugin' ),
                '2years'   => __( '2 Years', 'myplugin' ),
                'lifetime' => __( 'Lifetime', 'myplugin' ),
            ),
        ) );

        woocommerce_wp_textarea_input( array(
            'id'          => '_warranty_terms',
            'label'       => __( 'Warranty Terms', 'myplugin' ),
            'desc_tip'    => true,
            'description' => __( 'Describe what the warranty covers.', 'myplugin' ),
        ) );
        ?>
    </div>
    <?php
}

// Save warranty fields
add_action( 'woocommerce_process_product_meta', 'save_warranty_fields' );

function save_warranty_fields( $post_id ) {
    $period = isset( $_POST['_warranty_period'] ) ? sanitize_key( $_POST['_warranty_period'] ) : 'none';
    $terms  = isset( $_POST['_warranty_terms'] ) ? sanitize_textarea_field( $_POST['_warranty_terms'] ) : '';

    update_post_meta( $post_id, '_warranty_period', $period );
    update_post_meta( $post_id, '_warranty_terms', $terms );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_woocommerce` | Inspects WooCommerce hooks, templates, and HPOS status |
| `validate_php` | Checks WooCommerce integration code for issues |
| `run_wp_cli` | Manages products and orders via WC CLI |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
