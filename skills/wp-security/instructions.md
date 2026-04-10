# WordPress Security — Agent Skill

You are an expert in WordPress security, hardening, and secure coding practices.

## Input Validation & Sanitization

| Data Type | Sanitization Function |
|-----------|----------------------|
| Plain text | `sanitize_text_field($input)` |
| Textarea | `sanitize_textarea_field($input)` |
| Email | `sanitize_email($input)` |
| Filename | `sanitize_file_name($input)` |
| HTML class | `sanitize_html_class($input)` |
| Key/slug | `sanitize_key($input)` |
| Title | `sanitize_title($input)` |
| URL (for saving) | `esc_url_raw($input)` |
| Integer | `absint($input)` or `intval($input)` |
| Float | `floatval($input)` |
| Array of IDs | `array_map('absint', $input)` |
| Rich HTML | `wp_kses_post($input)` |
| Strict HTML | `wp_kses($input, $allowed_html)` |

## Output Escaping

| Context | Escape Function |
|---------|----------------|
| HTML body | `esc_html($text)` |
| HTML attribute | `esc_attr($text)` |
| URL/href | `esc_url($url)` |
| JavaScript inline | `esc_js($text)` |
| Translated text | `esc_html__()`, `esc_attr__()` |
| SQL | `$wpdb->prepare()` |
| CSS | `safecss_filter_attr($css)` |

```php
// WRONG — XSS vulnerability
echo '<a href="' . $url . '">' . $title . '</a>';

// RIGHT — properly escaped
echo '<a href="' . esc_url($url) . '">' . esc_html($title) . '</a>';

// WRONG — SQL injection
$wpdb->query("SELECT * FROM $wpdb->posts WHERE post_title = '$title'");

// RIGHT — prepared statement
$wpdb->get_results($wpdb->prepare(
    "SELECT * FROM $wpdb->posts WHERE post_title = %s AND post_status = %s",
    $title,
    'publish'
));
```

## Nonce Verification

```php
// CREATE nonce — in form
wp_nonce_field('myplugin_save_action', 'myplugin_nonce');

// CREATE nonce — for URL
$url = wp_nonce_url(admin_url('admin.php?action=delete&id=5'), 'myplugin_delete_5');

// CREATE nonce — standalone
$nonce = wp_create_nonce('myplugin_ajax_action');

// VERIFY — in form handler
if (!isset($_POST['myplugin_nonce']) || !wp_verify_nonce($_POST['myplugin_nonce'], 'myplugin_save_action')) {
    wp_die(__('Security check failed.', 'my-plugin'));
}

// VERIFY — in AJAX handler
check_ajax_referer('myplugin_ajax_action', 'nonce');

// VERIFY — for URL
check_admin_referer('myplugin_delete_5');
```

## User Roles & Capabilities

```php
// Check capability before action
if (!current_user_can('manage_options')) {
    wp_die(__('Unauthorized.', 'my-plugin'));
}

// Check post-specific capability
if (!current_user_can('edit_post', $post_id)) {
    wp_die(__('You cannot edit this post.', 'my-plugin'));
}

// Add custom capability
$role = get_role('editor');
$role->add_cap('myplugin_manage_settings');

// Custom capability check
if (current_user_can('myplugin_manage_settings')) {
    // show settings page
}
```

| Capability | Admin | Editor | Author | Contributor | Subscriber |
|-----------|-------|--------|--------|-------------|------------|
| `manage_options` | Yes | No | No | No | No |
| `edit_others_posts` | Yes | Yes | No | No | No |
| `publish_posts` | Yes | Yes | Yes | No | No |
| `edit_posts` | Yes | Yes | Yes | Yes | No |
| `read` | Yes | Yes | Yes | Yes | Yes |
| `upload_files` | Yes | Yes | Yes | No | No |
| `delete_posts` | Yes | Yes | Yes | Yes | No |
| `install_plugins` | Yes | No | No | No | No |

## REST API Security

```php
register_rest_route('my-plugin/v1', '/data', [
    'methods'             => 'POST',
    'callback'            => 'myplugin_handle_data',
    'permission_callback' => function (WP_REST_Request $request) {
        return current_user_can('edit_posts');
    },
    'args' => [
        'title' => [
            'required'          => true,
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'validate_callback' => function ($value) {
                return !empty($value) && strlen($value) <= 200;
            },
        ],
    ],
]);
```

## File Upload Security

```php
// Restrict allowed file types
add_filter('upload_mimes', function ($mimes) {
    unset($mimes['svg']);  // Remove SVG (potential XSS)
    unset($mimes['exe']);
    return $mimes;
});

// Validate uploaded file
$file = wp_handle_upload($_FILES['my_file'], [
    'test_form' => false,
    'mimes'     => ['jpg|jpeg' => 'image/jpeg', 'png' => 'image/png'],
]);

if (isset($file['error'])) {
    wp_die($file['error']);
}
```

## wp-config.php Hardening

```php
// Disable file editing in admin
define('DISALLOW_FILE_EDIT', true);

// Force SSL for admin
define('FORCE_SSL_ADMIN', true);

// Limit post revisions
define('WP_POST_REVISIONS', 5);

// Disable XML-RPC (if not needed)
add_filter('xmlrpc_enabled', '__return_false');

// Move wp-content directory
define('WP_CONTENT_DIR', dirname(__FILE__) . '/content');
define('WP_CONTENT_URL', 'https://example.com/content');

// Security keys — generate at https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'unique-random-value');
define('SECURE_AUTH_KEY',  'unique-random-value');
define('LOGGED_IN_KEY',    'unique-random-value');
define('NONCE_KEY',        'unique-random-value');

// Database table prefix — change from default 'wp_'
$table_prefix = 'mysite_';

// Hide WordPress version
remove_action('wp_head', 'wp_generator');
```

## .htaccess Security Rules

```apache
# Protect wp-config.php
<Files wp-config.php>
    Order Allow,Deny
    Deny from all
</Files>

# Protect .htaccess itself
<Files .htaccess>
    Order Allow,Deny
    Deny from all
</Files>

# Disable directory listing
Options -Indexes

# Block PHP execution in uploads
<Directory "/wp-content/uploads/">
    <Files "*.php">
        Order Allow,Deny
        Deny from all
    </Files>
</Directory>

# Limit login attempts (basic)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/wp-login\.php$
    RewriteCond %{REQUEST_METHOD} POST
    RewriteCond %{HTTP_REFERER} !^https?://(www\.)?example\.com [NC]
    RewriteRule .* - [F,L]
</IfModule>
```

## Common Vulnerabilities & Prevention

| Vulnerability | Prevention |
|--------------|------------|
| SQL Injection | `$wpdb->prepare()` for ALL variable queries |
| XSS (Cross-Site Scripting) | `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()` |
| CSRF (Cross-Site Request Forgery) | `wp_nonce_field()` + `wp_verify_nonce()` |
| Privilege Escalation | `current_user_can()` before every action |
| File Upload Attacks | Whitelist MIME types, validate extensions |
| Direct File Access | `if (!defined('ABSPATH')) exit;` at top of PHP files |
| Directory Traversal | `realpath()` + verify path is within expected directory |
| Object Injection | Never `unserialize()` user input, use `json_decode()` |
| Insecure Direct Object Reference | Verify user owns the resource before showing/editing |

## Best Practices

1. **Validate input, escape output** — the #1 rule of WordPress security
2. **Use nonces everywhere** — forms, AJAX, URL actions
3. **Check capabilities** — `current_user_can()` before destructive actions
4. **Use `$wpdb->prepare()`** — for every query with variable data, no exceptions
5. **Prefix with underscore** — `_myplugin_meta` to hide from custom fields UI
6. **Never trust `$_GET`, `$_POST`, `$_REQUEST`** — always sanitize
7. **Use `ABSPATH` check** — `if (!defined('ABSPATH')) exit;` in every PHP file
8. **Disable file editing** — `DISALLOW_FILE_EDIT` in production
9. **Keep WordPress updated** — core, themes, and plugins
10. **Use HTTPS everywhere** — `FORCE_SSL_ADMIN` and redirect HTTP to HTTPS
