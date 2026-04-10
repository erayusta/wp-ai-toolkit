# WP Plugin Development

> Build plugins with OOP architecture, autoloading, and WordPress.org submission

## What This Skill Covers

- Structuring plugins with OOP, namespaces, and PSR-4 autoloading
- Implementing activation, deactivation, and uninstall hooks
- Following WordPress.org plugin repository guidelines
- Setting up Composer and build scripts for distribution

## Example Usage

Ask your AI assistant:

```
> "Scaffold an OOP plugin structure with autoloading for wordpress.test"
```

### Example Output

```php
/**
 * Plugin Name: My Analytics Plugin
 * Description: Lightweight page analytics for WordPress.
 * Version:     1.0.0
 * Author:      Developer Name
 * Text Domain: my-analytics
 * Requires PHP: 8.0
 */

namespace MyAnalytics;

defined( 'ABSPATH' ) || exit;

define( 'MY_ANALYTICS_VERSION', '1.0.0' );
define( 'MY_ANALYTICS_PATH', plugin_dir_path( __FILE__ ) );

// PSR-4 Autoloader
spl_autoload_register( function( string $class ) {
    $prefix = 'MyAnalytics\\';
    if ( strpos( $class, $prefix ) !== 0 ) {
        return;
    }
    $relative = substr( $class, strlen( $prefix ) );
    $file     = MY_ANALYTICS_PATH . 'includes/' . str_replace( '\\', '/', $relative ) . '.php';
    if ( file_exists( $file ) ) {
        require $file;
    }
} );

// Lifecycle hooks
register_activation_hook( __FILE__, [ Installer::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ Installer::class, 'deactivate' ] );

// Boot the plugin
add_action( 'plugins_loaded', function() {
    Plugin::instance()->init();
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates plugin skeleton with OOP structure |
| `validate_php` | Checks coding standards and PHP compatibility |
| `build_assets` | Packages plugin for WordPress.org submission |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
