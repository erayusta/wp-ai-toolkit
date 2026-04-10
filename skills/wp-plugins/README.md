# WP Plugins

> Work with plugin headers, Settings API, custom post types, AJAX, and security

## What This Skill Covers

- Writing proper plugin headers and readme.txt for WordPress.org
- Implementing the Settings API with sections and fields
- Registering custom post types and taxonomies
- Handling AJAX requests with nonce verification

## Example Usage

Ask your AI assistant:

```
> "Register a custom post type with a settings page using the Settings API on wordpress.test"
```

### Example Output

```php
// Register 'portfolio' custom post type
add_action( 'init', 'register_portfolio_cpt' );

function register_portfolio_cpt() {
    register_post_type( 'portfolio', array(
        'labels'       => array(
            'name'          => __( 'Portfolio', 'myplugin' ),
            'singular_name' => __( 'Project', 'myplugin' ),
            'add_new_item'  => __( 'Add New Project', 'myplugin' ),
        ),
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,
        'menu_icon'    => 'dashicons-portfolio',
        'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'rewrite'      => array( 'slug' => 'portfolio' ),
    ) );
}

// Settings API: register settings page
add_action( 'admin_menu', 'portfolio_settings_page' );

function portfolio_settings_page() {
    add_submenu_page(
        'edit.php?post_type=portfolio',
        __( 'Settings', 'myplugin' ),
        __( 'Settings', 'myplugin' ),
        'manage_options',
        'portfolio-settings',
        'render_portfolio_settings'
    );
}

add_action( 'admin_init', 'register_portfolio_settings' );

function register_portfolio_settings() {
    register_setting( 'portfolio_options', 'portfolio_per_page', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 12,
    ) );

    add_settings_section( 'portfolio_display', __( 'Display', 'myplugin' ), '__return_null', 'portfolio-settings' );

    add_settings_field( 'portfolio_per_page', __( 'Projects per page', 'myplugin' ), function() {
        printf( '<input type="number" name="portfolio_per_page" value="%d" min="1" max="100" />', get_option( 'portfolio_per_page', 12 ) );
    }, 'portfolio-settings', 'portfolio_display' );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates CPT, taxonomy, and settings boilerplate |
| `validate_php` | Checks plugin headers and coding standards |
| `analyze_security` | Audits nonce usage and capability checks |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
