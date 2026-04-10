# WordPress Multisite — Agent Skill

You are an expert in WordPress Multisite network setup, management, and development.

## Enable Multisite

```php
// 1. Add to wp-config.php (before "That's all, stop editing!")
define('WP_ALLOW_MULTISITE', true);

// 2. After running Network Setup in Tools > Network Setup, add:
define('MULTISITE', true);
define('SUBDOMAIN_INSTALL', false);  // true for subdomain, false for subdirectory
define('DOMAIN_CURRENT_SITE', 'example.com');
define('PATH_CURRENT_SITE', '/');
define('SITE_ID_CURRENT_SITE', 1);
define('BLOG_ID_CURRENT_SITE', 1);
```

## Network vs Site Context

| Concept | Single Site | Multisite |
|---------|------------|-----------|
| Admin URL | `/wp-admin/` | `/wp-admin/network/` (super admin) |
| Options | `get_option()` | `get_site_option()` (network-wide) |
| Plugins | Per-site activate | Network activate OR per-site |
| Themes | Always available | Must be network-enabled first |
| Users | Per-site | Shared across network, roles per-site |
| Tables | `wp_options` | `wp_sitemeta` + `wp_{blog_id}_options` |

## Key Functions

```php
// Check if multisite
if (is_multisite()) {
    // multisite-specific code
}

// Get current site/blog ID
$blog_id = get_current_blog_id();

// Switch to another site
switch_to_blog(2);
$posts = get_posts(['numberposts' => 5]);
restore_current_blog(); // ALWAYS call this!

// Network-wide options
update_site_option('myplugin_network_key', $value);
$key = get_site_option('myplugin_network_key');

// Get all sites in network
$sites = get_sites([
    'number'  => 100,
    'orderby' => 'registered',
    'order'   => 'DESC',
]);

foreach ($sites as $site) {
    echo $site->blogname . ' — ' . $site->siteurl;
}

// Create a new site
$blog_id = wp_insert_site([
    'domain'  => 'newsite.example.com',  // or 'example.com' for subdirectory
    'path'    => '/newsite/',
    'site_id' => get_current_network_id(),
    'user_id' => get_current_user_id(),
    'title'   => 'New Site',
]);
```

## Network Admin Pages

```php
// Add menu to Network Admin
add_action('network_admin_menu', function () {
    add_menu_page(
        __('My Network Plugin', 'my-plugin'),
        __('My Plugin', 'my-plugin'),
        'manage_network_options',  // super admin capability
        'myplugin-network',
        'myplugin_network_page',
        'dashicons-admin-multisite'
    );
});

// Save network options
add_action('network_admin_edit_myplugin_save', function () {
    check_admin_referer('myplugin_network_options');

    update_site_option('myplugin_setting', sanitize_text_field($_POST['myplugin_setting'] ?? ''));

    wp_safe_redirect(add_query_arg('updated', 'true', network_admin_url('admin.php?page=myplugin-network')));
    exit;
});
```

## Multisite Hooks

| Hook | When |
|------|------|
| `wp_initialize_site` | After new site is created (replaces `wpmu_new_blog`) |
| `wp_delete_site` | When a site is deleted |
| `wp_insert_site` | When site data is inserted |
| `network_admin_menu` | Building network admin menu |
| `signup_blogform` | Registration form for new sites |
| `activate_blog` | When a site is activated |
| `deactivate_blog` | When a site is deactivated |
| `switch_blog` | When `switch_to_blog()` is called |

```php
// Run code when a new site is created
add_action('wp_initialize_site', function (WP_Site $new_site) {
    switch_to_blog($new_site->blog_id);

    // Create default pages, options, etc.
    wp_insert_post(['post_title' => 'Welcome', 'post_type' => 'page', 'post_status' => 'publish']);
    update_option('myplugin_version', '1.0.0');

    restore_current_blog();
}, 10, 1);
```

## Plugin Network Activation

```php
// Check if plugin is network activated
if (is_plugin_active_for_network('my-plugin/my-plugin.php')) {
    // network-wide behavior
}

// Run code on each site when network activating
register_activation_hook(__FILE__, function ($network_wide) {
    if (is_multisite() && $network_wide) {
        $sites = get_sites(['fields' => 'ids']);
        foreach ($sites as $blog_id) {
            switch_to_blog($blog_id);
            myplugin_activate_single_site();
            restore_current_blog();
        }
    } else {
        myplugin_activate_single_site();
    }
});

function myplugin_activate_single_site() {
    add_option('myplugin_version', '1.0.0');
    flush_rewrite_rules();
}
```

## Shared Tables vs Per-Site Tables

```php
global $wpdb;

// Network-wide table (no prefix per blog)
$table_network = $wpdb->base_prefix . 'myplugin_licenses';

// Per-site table (includes blog prefix)
$table_site = $wpdb->prefix . 'myplugin_data';
// For blog 1: wp_myplugin_data
// For blog 3: wp_3_myplugin_data
```

## WP-CLI Multisite Commands

```bash
# List all sites
wp site list --fields=blog_id,url,registered

# Create a new site
wp site create --slug=newsite --title="New Site" --email=admin@example.com

# Delete a site
wp site delete 3 --yes

# Run command on a specific site
wp post list --url=site2.example.com

# Run command on ALL sites
wp site list --field=url | xargs -I {} wp plugin activate my-plugin --url={}

# Network activate a plugin
wp plugin activate my-plugin --network

# Network enable a theme
wp theme enable twentytwentyfive --network
```

## Best Practices

1. **Always `restore_current_blog()`** — after every `switch_to_blog()`, use try/finally
2. **Use `get_site_option()`** — for network-wide settings, not `get_option()`
3. **Check `is_multisite()`** — before using multisite-specific functions
4. **Use `manage_network_options`** — capability for super admin checks
5. **Handle network activation** — iterate all sites on network-wide activation
6. **Shared vs per-site tables** — `$wpdb->base_prefix` vs `$wpdb->prefix`
7. **Use `get_sites()`** — not direct DB queries for site lists
8. **Test both modes** — subdomain and subdirectory installs behave differently
9. **Avoid hardcoded URLs** — use `network_site_url()`, `network_admin_url()`
10. **Domain mapping** — use `wp_get_sites()` with domain awareness for custom domains
