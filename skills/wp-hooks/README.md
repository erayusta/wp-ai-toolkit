# WP Hooks

> Master actions, filters, priority ordering, and dynamic hooks

## What This Skill Covers

- Using add_action and add_filter with proper priorities
- Creating custom hooks for extensible plugin architecture
- Working with dynamic hooks like `save_post_{$post_type}`
- Debugging hook execution order and removing callbacks

## Example Usage

Ask your AI assistant:

```
> "Show me how to use dynamic hooks to customize save behavior per CPT on wordpress.test"
```

### Example Output

```php
// Dynamic hook: fires only for 'product' post type saves
add_action( 'save_post_product', 'handle_product_save', 10, 3 );

function handle_product_save( int $post_id, WP_Post $post, bool $update ) {
    // Skip autosaves and revisions
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( wp_is_post_revision( $post_id ) ) {
        return;
    }

    // Verify nonce
    if ( ! isset( $_POST['product_meta_nonce'] )
        || ! wp_verify_nonce( $_POST['product_meta_nonce'], 'save_product_meta' ) ) {
        return;
    }

    // Save custom fields
    $fields = array( 'sku', 'price', 'stock_status' );
    foreach ( $fields as $field ) {
        if ( isset( $_POST[ "product_{$field}" ] ) ) {
            update_post_meta(
                $post_id,
                "_product_{$field}",
                sanitize_text_field( $_POST[ "product_{$field}" ] )
            );
        }
    }

    // Fire custom hook for extensions
    do_action( 'myplugin_after_product_save', $post_id, $post );
}

// Remove a core action and replace with custom
remove_action( 'wp_head', 'wp_generator' );
add_action( 'wp_head', 'custom_meta_generator', 1 );

function custom_meta_generator() {
    echo '<meta name="generator" content="My Awesome Site">' . "\n";
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_hooks` | Lists all registered hooks and their callbacks |
| `validate_php` | Checks hook registration for common mistakes |
| `scaffold_component` | Generates hook-based plugin architecture |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
