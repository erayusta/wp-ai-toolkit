# WordPress Plugin Development — Agent Skill

You are an expert in professional WordPress plugin development: architecture patterns, OOP structure, autoloading, licensing, distribution, update mechanisms, and WordPress.org submission.

## Modern Plugin Architecture (OOP)

```
my-plugin/
├── my-plugin.php              # Entry point, plugin header, bootstrap
├── uninstall.php              # Clean removal
├── composer.json              # Autoloading + dependencies
├── includes/
│   ├── class-plugin.php       # Main plugin class (singleton)
│   ├── class-activator.php    # Activation logic
│   ├── class-deactivator.php  # Deactivation logic
│   ├── Admin/
│   │   ├── class-settings.php # Settings page
│   │   ├── class-meta-box.php # Custom meta boxes
│   │   └── class-list-table.php # Custom WP_List_Table
│   ├── Frontend/
│   │   ├── class-shortcodes.php
│   │   └── class-widgets.php
│   ├── API/
│   │   └── class-rest-controller.php
│   ├── Models/
│   │   └── class-entry.php    # Data model
│   └── Traits/
│       └── trait-singleton.php
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── languages/
├── templates/                 # Public-facing templates
├── tests/
│   ├── bootstrap.php
│   └── test-*.php
├── phpcs.xml.dist
├── phpunit.xml.dist
└── readme.txt
```

## Entry Point (Main Plugin File)

```php
<?php
/**
 * Plugin Name: My Pro Plugin
 * Plugin URI:  https://example.com/my-pro-plugin
 * Description: A professional WordPress plugin.
 * Version:     1.0.0
 * Author:      Your Name
 * Author URI:  https://example.com
 * License:     GPL-2.0+
 * Text Domain: my-pro-plugin
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

if (!defined('ABSPATH')) exit;

define('MPP_VERSION', '1.0.0');
define('MPP_FILE', __FILE__);
define('MPP_PATH', plugin_dir_path(__FILE__));
define('MPP_URL', plugin_dir_url(__FILE__));
define('MPP_BASENAME', plugin_basename(__FILE__));

// Composer autoloader
if (file_exists(MPP_PATH . 'vendor/autoload.php')) {
    require_once MPP_PATH . 'vendor/autoload.php';
}

// Bootstrap
register_activation_hook(__FILE__, ['MPP\\Activator', 'activate']);
register_deactivation_hook(__FILE__, ['MPP\\Deactivator', 'deactivate']);

add_action('plugins_loaded', function () {
    MPP\Plugin::instance()->init();
});
```

## Main Plugin Class (Singleton)

```php
<?php
namespace MPP;

class Plugin {
    private static ?self $instance = null;
    private string $version;

    public static function instance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->version = MPP_VERSION;
    }

    public function init(): void {
        $this->load_textdomain();
        $this->register_hooks();

        if (is_admin()) {
            (new Admin\Settings())->init();
            (new Admin\MetaBox())->init();
        }

        (new Frontend\Shortcodes())->init();
        (new API\RestController())->init();
    }

    private function load_textdomain(): void {
        load_plugin_textdomain('my-pro-plugin', false, dirname(MPP_BASENAME) . '/languages');
    }

    private function register_hooks(): void {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin']);
        add_action('init', [$this, 'register_post_types']);
    }

    public function enqueue_frontend(): void {
        wp_enqueue_style('mpp-frontend', MPP_URL . 'assets/css/frontend.css', [], $this->version);
        wp_enqueue_script('mpp-frontend', MPP_URL . 'assets/js/frontend.js', [], $this->version, true);
    }

    public function enqueue_admin(string $hook): void {
        if (!str_starts_with($hook, 'toplevel_page_mpp') && $hook !== 'settings_page_mpp') return;
        wp_enqueue_style('mpp-admin', MPP_URL . 'assets/css/admin.css', [], $this->version);
        wp_enqueue_script('mpp-admin', MPP_URL . 'assets/js/admin.js', ['jquery'], $this->version, true);
    }

    public function register_post_types(): void {
        register_post_type('mpp_entry', [
            'public'       => true,
            'show_in_rest' => true,
            'label'        => __('Entries', 'my-pro-plugin'),
            'supports'     => ['title', 'editor', 'thumbnail'],
            'menu_icon'    => 'dashicons-list-view',
        ]);
    }
}
```

## Composer Autoloading

```json
{
    "name": "vendor/my-pro-plugin",
    "autoload": {
        "psr-4": {
            "MPP\\": "includes/"
        }
    },
    "require": {
        "php": ">=8.0"
    },
    "require-dev": {
        "squizlabs/php_codesniffer": "^3.7",
        "wp-coding-standards/wpcs": "^3.0",
        "phpunit/phpunit": "^9.6"
    }
}
```

## Service Container Pattern

```php
<?php
namespace MPP;

class Container {
    private array $services = [];
    private array $instances = [];

    public function register(string $name, callable $factory): void {
        $this->services[$name] = $factory;
    }

    public function get(string $name): mixed {
        if (!isset($this->instances[$name])) {
            if (!isset($this->services[$name])) {
                throw new \RuntimeException("Service '{$name}' not registered.");
            }
            $this->instances[$name] = ($this->services[$name])($this);
        }
        return $this->instances[$name];
    }
}

// Usage in main plugin:
$container = new Container();
$container->register('settings', fn($c) => new Admin\Settings());
$container->register('api', fn($c) => new API\RestController($c->get('settings')));
```

## WordPress.org Submission

### readme.txt Format
```
=== My Pro Plugin ===
Contributors: yourusername
Donate link: https://example.com/donate
Tags: utility, tool, custom
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Short description (max 150 chars) for the plugin directory.

== Description ==

Full description with features list, screenshots references.

**Key Features:**
* Feature one
* Feature two
* Feature three

== Installation ==

1. Upload `my-pro-plugin` to `/wp-content/plugins/`
2. Activate via 'Plugins' menu
3. Configure at Settings > My Plugin

== Frequently Asked Questions ==

= How do I configure? =
Go to Settings > My Plugin.

== Screenshots ==

1. Settings page — configure all options here.
2. Frontend widget — how it looks on your site.

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release.
```

### SVN Deployment to WordPress.org
```bash
# After plugin is accepted:
svn co https://plugins.svn.wordpress.org/my-pro-plugin/ svn-repo
cd svn-repo

# Copy plugin files to trunk
cp -r /path/to/my-pro-plugin/* trunk/

# Tag a release
svn cp trunk tags/1.0.0

# Add new files
svn add --force .
svn ci -m "Release 1.0.0" --username yourusername
```

## Custom Update Mechanism (for Premium Plugins)

```php
// Check for updates from your own server
add_filter('pre_set_site_transient_update_plugins', function ($transient) {
    $response = wp_remote_get('https://api.example.com/plugin/check-update', [
        'body' => ['version' => MPP_VERSION, 'license' => get_option('mpp_license_key')],
    ]);

    if (!is_wp_error($response)) {
        $data = json_decode(wp_remote_retrieve_body($response));
        if ($data && version_compare(MPP_VERSION, $data->new_version, '<')) {
            $transient->response[MPP_BASENAME] = (object) [
                'slug'        => 'my-pro-plugin',
                'new_version' => $data->new_version,
                'url'         => $data->url,
                'package'     => $data->download_url,
            ];
        }
    }
    return $transient;
});
```

## License Key System

```php
class License {
    const OPTION_KEY = 'mpp_license_key';
    const STATUS_KEY = 'mpp_license_status';

    public static function activate(string $key): bool {
        $response = wp_remote_post('https://api.example.com/license/activate', [
            'body' => [
                'key'    => sanitize_text_field($key),
                'domain' => home_url(),
            ],
        ]);

        if (is_wp_error($response)) return false;

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if ($data['status'] === 'valid') {
            update_option(self::OPTION_KEY, sanitize_text_field($key));
            update_option(self::STATUS_KEY, 'active');
            return true;
        }
        return false;
    }

    public static function is_valid(): bool {
        return get_option(self::STATUS_KEY) === 'active';
    }
}
```

## Best Practices

1. **Use namespaces** — `namespace MyPlugin;` for all classes
2. **PSR-4 autoloading** — via Composer, no manual `require_once`
3. **Singleton for main class** — one instance, lazy initialization
4. **Separate concerns** — Admin, Frontend, API, Models in their own directories
5. **Use constants** — `PLUGIN_VERSION`, `PLUGIN_PATH`, `PLUGIN_URL`
6. **Conditional loading** — `is_admin()` check before loading admin classes
7. **readme.txt** — follow WordPress.org format exactly for submission
8. **Semantic versioning** — MAJOR.MINOR.PATCH
9. **Clean uninstall** — `uninstall.php` removes ALL plugin data
10. **Test before release** — PHPUnit + Plugin Check plugin + manual testing
