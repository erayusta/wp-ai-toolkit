# WordPress Plugins — Agent Skill

You are an expert in WordPress plugin development. Follow these guidelines when helping users.

## Plugin Header Comment

Every plugin's main file must start with a header comment:

```php
<?php
/**
 * Plugin Name: My Awesome Plugin
 * Plugin URI:  https://example.com/my-plugin
 * Description: A brief description of what this plugin does.
 * Version:     1.0.0
 * Author:      Your Name
 * Author URI:  https://example.com
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: my-awesome-plugin
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
```

## Activation / Deactivation / Uninstall

```php
// Activation: create tables, set defaults, flush rewrites
register_activation_hook(__FILE__, function () {
    add_option('myplugin_version', '1.0.0');
    flush_rewrite_rules();
});

// Deactivation: clean up temporary data, flush rewrites
register_deactivation_hook(__FILE__, function () {
    flush_rewrite_rules();
});

// Uninstall: remove ALL plugin data (use uninstall.php or hook)
register_uninstall_hook(__FILE__, 'myplugin_uninstall');
function myplugin_uninstall() {
    delete_option('myplugin_version');
    delete_option('myplugin_settings');
    // Drop custom tables if created
}
```

## Settings API

```php
add_action('admin_init', function () {
    register_setting('myplugin_options', 'myplugin_settings', [
        'type'              => 'array',
        'sanitize_callback' => 'myplugin_sanitize_settings',
    ]);

    add_settings_section(
        'myplugin_general',
        __('General Settings', 'my-plugin'),
        function () { echo '<p>Configure the plugin.</p>'; },
        'myplugin-settings'
    );

    add_settings_field(
        'myplugin_api_key',
        __('API Key', 'my-plugin'),
        function () {
            $options = get_option('myplugin_settings', []);
            printf(
                '<input type="text" name="myplugin_settings[api_key]" value="%s" class="regular-text">',
                esc_attr($options['api_key'] ?? '')
            );
        },
        'myplugin-settings',
        'myplugin_general'
    );
});

function myplugin_sanitize_settings($input) {
    $sanitized = [];
    $sanitized['api_key'] = sanitize_text_field($input['api_key'] ?? '');
    return $sanitized;
}
```

## Admin Pages

```php
add_action('admin_menu', function () {
    // Top-level menu
    add_menu_page(
        __('My Plugin', 'my-plugin'),     // Page title
        __('My Plugin', 'my-plugin'),     // Menu title
        'manage_options',                  // Capability
        'myplugin-settings',              // Menu slug
        'myplugin_render_settings_page',  // Callback
        'dashicons-admin-generic',        // Icon
        80                                 // Position
    );

    // Submenu under Settings
    add_options_page(
        __('My Plugin Settings', 'my-plugin'),
        __('My Plugin', 'my-plugin'),
        'manage_options',
        'myplugin-settings',
        'myplugin_render_settings_page'
    );
});

function myplugin_render_settings_page() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <form action="options.php" method="post">
            <?php
            settings_fields('myplugin_options');
            do_settings_sections('myplugin-settings');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
```

## Custom Post Types

```php
add_action('init', function () {
    register_post_type('book', [
        'labels' => [
            'name'               => __('Books', 'my-plugin'),
            'singular_name'      => __('Book', 'my-plugin'),
            'add_new_item'       => __('Add New Book', 'my-plugin'),
            'edit_item'          => __('Edit Book', 'my-plugin'),
            'search_items'       => __('Search Books', 'my-plugin'),
            'not_found'          => __('No books found', 'my-plugin'),
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,  // Required for block editor + REST API
        'supports'     => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'menu_icon'    => 'dashicons-book',
        'rewrite'      => ['slug' => 'books'],
    ]);
});
```

## Custom Taxonomies

```php
add_action('init', function () {
    register_taxonomy('genre', ['book'], [
        'labels' => [
            'name'          => __('Genres', 'my-plugin'),
            'singular_name' => __('Genre', 'my-plugin'),
            'search_items'  => __('Search Genres', 'my-plugin'),
            'add_new_item'  => __('Add New Genre', 'my-plugin'),
        ],
        'public'       => true,
        'hierarchical' => true,
        'show_in_rest' => true,
        'rewrite'      => ['slug' => 'genre'],
    ]);
});
```

## Shortcodes

```php
add_shortcode('greeting', function ($atts) {
    $atts = shortcode_atts([
        'name' => 'World',
    ], $atts, 'greeting');

    return sprintf('<p class="greeting">Hello, %s!</p>', esc_html($atts['name']));
});
// Usage: [greeting name="WordPress"]
```

## AJAX Handling

```php
// Enqueue script with nonce
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('myplugin-ajax', plugin_dir_url(__FILE__) . 'js/ajax.js', ['jquery'], '1.0.0', true);
    wp_localize_script('myplugin-ajax', 'myPluginAjax', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('myplugin_nonce'),
    ]);
});

// Handle AJAX — logged-in users
add_action('wp_ajax_myplugin_save', function () {
    check_ajax_referer('myplugin_nonce', 'nonce');

    if (!current_user_can('edit_posts')) {
        wp_send_json_error('Unauthorized', 403);
    }

    $data = sanitize_text_field($_POST['data'] ?? '');
    // Process $data...

    wp_send_json_success(['message' => 'Saved']);
});

// Handle AJAX — logged-out users (optional)
add_action('wp_ajax_nopriv_myplugin_save', function () {
    wp_send_json_error('Login required', 401);
});
```

```js
// js/ajax.js
jQuery(function ($) {
    $('#save-btn').on('click', function () {
        $.post(myPluginAjax.ajaxUrl, {
            action: 'myplugin_save',
            nonce: myPluginAjax.nonce,
            data: $('#my-input').val()
        }).done(function (response) {
            console.log(response.data.message);
        });
    });
});
```

## Security Essentials

| Task | Function |
|------|----------|
| Sanitize text input | `sanitize_text_field()` |
| Sanitize email | `sanitize_email()` |
| Sanitize URL | `esc_url_raw()` (for saving), `esc_url()` (for output) |
| Sanitize integer | `absint()` or `intval()` |
| Sanitize HTML | `wp_kses()` or `wp_kses_post()` |
| Escape HTML output | `esc_html()` |
| Escape attribute output | `esc_attr()` |
| Escape URL output | `esc_url()` |
| Escape JavaScript | `esc_js()` |
| Create nonce | `wp_create_nonce('action_name')` |
| Verify nonce (AJAX) | `check_ajax_referer('action_name', 'nonce')` |
| Verify nonce (form) | `wp_verify_nonce($_POST['_wpnonce'], 'action_name')` |
| Check capability | `current_user_can('manage_options')` |
| Prepared SQL | `$wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id)` |

## Best Practices

1. **Prefix everything** — functions, classes, constants, options, hooks, script handles
2. **Use namespaces or classes** — avoid polluting the global scope
3. **Internationalize all strings** — `__()`, `_e()`, `esc_html__()`, `_n()` with text domain
4. **Follow WordPress Coding Standards** — WPCS with PHP_CodeSniffer
5. **Load conditionally** — only enqueue scripts/styles on pages where needed
6. **Clean up on uninstall** — remove all options, transients, custom tables, cron events
7. **Use `$wpdb->prepare()`** — for ALL database queries with variable data
8. **Check capabilities** — before performing any privileged action
9. **Validate and sanitize all input** — never trust user data
10. **Escape all output** — even data you stored yourself
