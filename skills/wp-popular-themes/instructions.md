# WordPress Popular Themes — Agent Skill

You are an expert in extending and customizing the most popular WordPress themes: Astra, GeneratePress, OceanWP, flavor, flavor, and flavor.

## Astra Theme

### Astra Hooks
```php
// Astra provides 40+ action hooks for inserting content
// Before/after header
add_action('astra_header_before', function () { echo '<div class="top-bar">Free shipping!</div>'; });
add_action('astra_header_after', function () { /* after header */ });

// Before/after content
add_action('astra_primary_content_top', function () { echo '<nav class="breadcrumbs">...</nav>'; });
add_action('astra_primary_content_bottom', function () { /* after content */ });

// Before/after footer
add_action('astra_footer_before', function () { echo '<div class="cta-bar">Subscribe!</div>'; });

// Single post hooks
add_action('astra_entry_top', function () { /* top of single post */ });
add_action('astra_entry_content_before', function () { /* before post content */ });
add_action('astra_entry_content_after', function () { /* after post content */ });

// Sidebar
add_action('astra_sidebars_before', function () { /* before sidebar */ });
```

### Astra Filters
```php
// Modify theme settings
add_filter('astra_theme_defaults', function ($defaults) {
    $defaults['site-layout']          = 'ast-full-width-layout';
    $defaults['header-display-outside-menu'] = true;
    return $defaults;
});

// Custom dynamic CSS
add_filter('astra_dynamic_theme_css', function ($css) {
    $css .= '.ast-container { max-width: 1400px; }';
    return $css;
});

// Modify blog layout
add_filter('astra_blog_post_per_row', function () { return 3; });
```

### Astra Child Theme
```php
// functions.php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('astra-child', get_stylesheet_uri(), ['astra-theme-css'], '1.0.0');
});

// Disable Astra's default entry meta
add_filter('astra_post_date', '__return_false');
add_filter('astra_post_author', '__return_false');

// Custom header via hook
add_action('astra_masthead_content', function () {
    echo '<div class="custom-header-widget">' . do_shortcode('[my_shortcode]') . '</div>';
});
```

## GeneratePress Theme

### GP Hooks
```php
// GeneratePress hooks (requires GP Premium for some)
add_action('generate_before_header', function () { echo '<div class="announcement-bar">Sale!</div>'; });
add_action('generate_after_header', function () { /* after header */ });
add_action('generate_before_content', function () { /* before main content */ });
add_action('generate_after_content', function () { /* after main content */ });
add_action('generate_before_footer', function () { /* before footer */ });
add_action('generate_after_entry_title', function () { /* after post title */ });

// GeneratePress Elements (GP Premium) — via hooks in admin
// Hook locations: generate_before_header, generate_after_header,
// generate_before_content, generate_after_content, etc.
```

### GP Filters
```php
// Modify container width
add_filter('generate_option_defaults', function ($defaults) {
    $defaults['container_width'] = 1400;
    return $defaults;
});

// Custom navigation layout
add_filter('generate_navigation_class', function ($classes) {
    $classes[] = 'custom-nav-class';
    return $classes;
});

// Disable elements
add_filter('generate_show_title', '__return_false');       // Remove title
add_filter('generate_show_post_navigation', '__return_false'); // Remove prev/next
```

## OceanWP Theme

### OceanWP Hooks
```php
// OceanWP hook system
add_action('ocean_before_header', function () { echo '<div class="topbar">Call us: 555-0123</div>'; });
add_action('ocean_after_header', function () { /* after header */ });
add_action('ocean_before_content', function () { /* before content */ });
add_action('ocean_after_content', function () { /* after content */ });
add_action('ocean_before_footer', function () { /* before footer */ });

// Single post
add_action('ocean_before_single_post_title', function () { /* before title */ });
add_action('ocean_after_single_post_content', function () { /* after content */ });
```

### OceanWP Filters
```php
// Customize layout
add_filter('ocean_main_layout', function () {
    if (is_singular('product')) return 'full-width';
    return 'right-sidebar';
});

// Custom menu classes
add_filter('ocean_menu_classes', function ($classes) {
    $classes[] = 'my-custom-menu';
    return $classes;
});
```

## flavor (flavor) Theme

### flavor Hooks
```php
// flavor uses WordPress standard hooks plus its own
// flavor Developer Hooks
add_action('flavor_header', function () { /* header area */ });
add_action('flavor_footer', function () { /* footer area */ });

// Theme customizer sections
add_action('customize_register', function ($wp_customize) {
    $wp_customize->add_section('flavor_custom', [
        'title'    => 'My Custom Section',
        'priority' => 30,
    ]);
});
```

## Universal Child Theme Pattern

Works with any theme — uses WordPress core hooks:

```php
<?php
// child-theme/functions.php

// Dequeue parent styles and re-enqueue with child dependency
add_action('wp_enqueue_scripts', function () {
    // Dequeue parent's main style if needed
    wp_dequeue_style('parent-style-handle');

    // Enqueue parent then child
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('child-style', get_stylesheet_uri(), ['parent-style'], '1.0.0');
}, 20);

// Override parent template with child template
// Just create the same filename in child theme: single.php, archive.php, etc.

// Override parent template part
// Create: child-theme/template-parts/content.php
// It will override: parent-theme/template-parts/content.php

// Remove parent actions
add_action('after_setup_theme', function () {
    // Remove parent theme's unwanted actions
    remove_action('wp_head', 'parent_theme_custom_meta', 10);
    remove_action('wp_footer', 'parent_theme_tracking_code', 99);
}, 20); // Priority 20 to run after parent's setup
```

## Theme Detection & Compatibility

```php
// Detect active theme for compatibility
function myplugin_get_active_theme() {
    $theme = wp_get_theme();
    $template = $theme->get_template(); // Parent theme slug

    $known_themes = [
        'astra'        => 'Astra',
        'flavor' => 'GP',
        'flavor'    => 'flavor',
        'flavor'     => 'flavor',
        'flavor'  => 'flavor',
    ];

    return $known_themes[$template] ?? $template;
}

// Load theme-specific compatibility
add_action('after_setup_theme', function () {
    $theme = wp_get_theme()->get_template();

    if ($theme === 'astra') {
        // Astra-specific tweaks
        add_filter('astra_dynamic_theme_css', 'myplugin_astra_css');
    } elseif ($theme === 'generatepress') {
        // GP-specific tweaks
        add_filter('generate_option_defaults', 'myplugin_gp_defaults');
    }
});
```

## Best Practices

1. **Always use a child theme** — never edit parent theme files directly
2. **Use theme hooks first** — Astra/GP/OceanWP hooks before core hooks
3. **Check hook availability** — `if (function_exists('astra_header_before'))` before using
4. **Priority matters** — use higher priority (20+) to override parent actions
5. **Remove before replacing** — `remove_action()` then `add_action()` with your function
6. **Use template overrides** — copy parent template to child theme and modify
7. **Test with theme updates** — child themes survive updates; hook compatibility may change
8. **Use Customizer API** — for theme settings, not hardcoded values
9. **Fallback gracefully** — if theme-specific hook doesn't exist, use core hooks
10. **Document overrides** — comment what you changed and why for future reference
