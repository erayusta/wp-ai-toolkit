# WordPress Themes — Agent Skill

You are an expert in WordPress theme development. Follow these guidelines when helping users.

## Block Themes vs Classic Themes

| Feature | Block Theme | Classic Theme |
|---------|------------|---------------|
| Templates | `.html` files in `/templates/` | `.php` files in root |
| Customization | Site Editor + `theme.json` | Customizer + `functions.php` |
| Styling | `theme.json` design tokens | `style.css` + enqueued CSS |
| Template parts | `/parts/header.html` | `get_header()` / `get_footer()` |
| Required files | `style.css`, `templates/index.html` | `style.css`, `index.php` |
| Widgets | Not used (blocks instead) | `register_sidebar()` + widget areas |
| Menus | Navigation block | `register_nav_menus()` |

## Template Hierarchy

WordPress loads templates in a specific order. The first match wins:

```
Specific ──────────────────────────────── Generic

single-{post-type}-{slug}.html
  └─ single-{post-type}.html
       └─ single.html
            └─ singular.html
                 └─ index.html

page-{slug}.html
  └─ page-{id}.html
       └─ page.html
            └─ singular.html
                 └─ index.html

archive-{post-type}.html
  └─ archive.html
       └─ index.html

category-{slug}.html
  └─ category-{id}.html
       └─ category.html
            └─ archive.html
                 └─ index.html

front-page.html > home.html > index.html
search.html > index.html
404.html > index.html
```

## theme.json

The central configuration file for block themes. Controls global styles, settings, and design tokens.

```json
{
  "$schema": "https://schemas.wp.org/trunk/theme.json",
  "version": 3,
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary", "color": "#1e40af", "name": "Primary" },
        { "slug": "secondary", "color": "#9333ea", "name": "Secondary" }
      ],
      "gradients": [],
      "custom": false
    },
    "typography": {
      "fontFamilies": [
        { "fontFamily": "Inter, sans-serif", "slug": "body", "name": "Body" }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem", "name": "Small" },
        { "slug": "medium", "size": "1rem", "name": "Medium" },
        { "slug": "large", "size": "1.5rem", "name": "Large" }
      ]
    },
    "spacing": {
      "units": ["px", "rem", "%"],
      "padding": true,
      "margin": true
    },
    "layout": {
      "contentSize": "720px",
      "wideSize": "1200px"
    },
    "appearanceTools": true
  },
  "styles": {
    "color": { "background": "#ffffff", "text": "#1a1a1a" },
    "typography": { "fontFamily": "var(--wp--preset--font-family--body)", "fontSize": "var(--wp--preset--font-size--medium)" },
    "spacing": { "padding": { "top": "2rem", "bottom": "2rem", "left": "1.5rem", "right": "1.5rem" } },
    "blocks": {
      "core/heading": {
        "typography": { "fontWeight": "700" }
      }
    }
  },
  "customTemplates": [
    { "name": "blank", "title": "Blank", "postTypes": ["page"] }
  ],
  "templateParts": [
    { "name": "header", "title": "Header", "area": "header" },
    { "name": "footer", "title": "Footer", "area": "footer" }
  ]
}
```

## Full Site Editing (FSE)

Block themes use the Site Editor for full visual control:

- **Templates**: `templates/index.html`, `templates/single.html`, etc.
- **Template Parts**: `parts/header.html`, `parts/footer.html`
- **Patterns**: PHP files in `patterns/` directory that register block patterns

```html
<!-- templates/single.html -->
<!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:post-title {"level":1} /-->
  <!-- wp:post-featured-image /-->
  <!-- wp:post-content /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","area":"footer"} /-->
```

```php
<?php
// patterns/hero.php
/**
 * Title: Hero Section
 * Slug: mytheme/hero
 * Categories: featured
 */
?>
<!-- wp:cover {"dimRatio":50} -->
<div class="wp-block-cover">
  <!-- wp:heading {"textAlign":"center","level":1} -->
  <h1 class="has-text-align-center">Welcome</h1>
  <!-- /wp:heading -->
</div>
<!-- /wp:cover -->
```

## Classic Theme Essentials

```php
<?php
// functions.php

// Theme setup
add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', ['search-form', 'comment-form', 'gallery', 'caption']);
    add_theme_support('automatic-feed-links');

    register_nav_menus([
        'primary' => __('Primary Menu', 'mytheme'),
        'footer'  => __('Footer Menu', 'mytheme'),
    ]);
});

// Enqueue styles and scripts
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('mytheme-style', get_stylesheet_uri(), [], '1.0.0');
    wp_enqueue_script('mytheme-js', get_template_directory_uri() . '/js/main.js', [], '1.0.0', true);
});

// Widget areas
add_action('widgets_init', function () {
    register_sidebar([
        'name'          => __('Sidebar', 'mytheme'),
        'id'            => 'sidebar-1',
        'before_widget' => '<section class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ]);
});
```

## style.css Header

```css
/*
Theme Name: My Theme
Theme URI: https://example.com/my-theme
Author: Your Name
Author URI: https://example.com
Description: A custom WordPress theme.
Version: 1.0.0
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: mytheme
Tags: custom-background, custom-logo, block-styles, full-site-editing
*/
```

## Child Themes

```css
/* style.css */
/*
Theme Name: My Theme Child
Template: parent-theme-slug
Version: 1.0.0
*/
```

```php
<?php
// functions.php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('child-style', get_stylesheet_uri(), ['parent-style']);
});
```

## Best Practices

1. **Use `theme.json` for design tokens** — colors, fonts, spacing should be defined there, not hardcoded in CSS
2. **Escape all output** — `esc_html()`, `esc_attr()`, `esc_url()` in templates
3. **Use `get_template_part()`** — for reusable template sections
4. **Prefix everything** — functions, classes, handles to avoid collisions
5. **Support accessibility** — semantic HTML, ARIA labels, skip links, focus styles
6. **Use `wp_enqueue_*`** — never hardcode `<script>` or `<link>` tags
7. **Make themes translation-ready** — wrap strings in `__()`, `_e()`, `esc_html__()`
8. **Test with Theme Check plugin** — catches common issues before submission
9. **Support wide and full alignments** — via `theme.json` layout settings
10. **Use `wp_body_open()`** — in templates right after `<body>` for plugin compatibility
