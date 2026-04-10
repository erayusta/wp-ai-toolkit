# WordPress Multilingual — Agent Skill

You are an expert in WordPress multilingual setup: WPML, Polylang, Weglot, translation functions, hreflang, and RTL support.

## Translation Functions

```php
// Basic translation
__('Hello World', 'my-plugin');       // Returns translated string
_e('Hello World', 'my-plugin');       // Echoes translated string
esc_html__('Hello', 'my-plugin');     // Returns escaped + translated
esc_html_e('Hello', 'my-plugin');     // Echoes escaped + translated
esc_attr__('Title', 'my-plugin');     // Attribute-safe + translated

// Pluralization
sprintf(
    _n('%d item', '%d items', $count, 'my-plugin'),
    $count
);

// Context disambiguation
_x('Post', 'noun — a blog post', 'my-plugin');
_x('Post', 'verb — to publish', 'my-plugin');

// With variables
sprintf(__('Hello %s, you have %d messages.', 'my-plugin'), $name, $count);

// Number formatting (locale-aware)
number_format_i18n(1234567.89);  // "1,234,567.89" or "1.234.567,89"

// Date formatting (locale-aware)
date_i18n('F j, Y', strtotime($date));  // "April 10, 2026" or "10 Nisan 2026"
```

## Loading Text Domain

```php
// For plugins
add_action('init', function () {
    load_plugin_textdomain('my-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages');
});

// For themes
add_action('after_setup_theme', function () {
    load_theme_textdomain('mytheme', get_template_directory() . '/languages');
});

// Generate .pot file
// wp i18n make-pot . languages/my-plugin.pot --domain=my-plugin
// wp i18n make-json languages/ --no-purge
```

## WP-CLI i18n Commands

```bash
# Generate .pot file from source
wp i18n make-pot . languages/my-plugin.pot --domain=my-plugin

# Create .po from .pot for a specific locale
cp languages/my-plugin.pot languages/my-plugin-tr_TR.po
# Edit .po file with Poedit or similar

# Generate .mo from .po (binary compiled)
wp i18n make-mo languages/

# Generate .json for JavaScript translations (Gutenberg blocks)
wp i18n make-json languages/ --no-purge
```

## WPML Integration

```php
// Check if WPML is active
if (defined('ICL_SITEPRESS_VERSION')) {
    // WPML is active
}

// Get current language
$current_lang = apply_filters('wpml_current_language', null);

// Get translated post ID
$translated_id = apply_filters('wpml_object_id', $post_id, 'post', true, 'tr');

// Switch language context
do_action('wpml_switch_language', 'tr');
// ... do something in Turkish context ...
do_action('wpml_switch_language', null); // switch back

// Register strings for translation (for plugin/theme options)
do_action('wpml_register_single_string', 'my-plugin', 'CTA Button Text', 'Buy Now');

// Get translated string
$cta = apply_filters('wpml_translate_single_string', 'Buy Now', 'my-plugin', 'CTA Button Text');

// Language switcher
do_action('wpml_add_language_selector');

// Get all active languages
$languages = apply_filters('wpml_active_languages', null, ['skip_missing' => 0]);
```

## Polylang Integration

```php
// Check if Polylang is active
if (function_exists('pll_current_language')) {
    // Polylang is active
}

// Get current language
$lang = pll_current_language();        // 'en', 'tr', 'fr'
$lang = pll_current_language('name');  // 'English', 'Turkish'

// Get translated post ID
$translated_id = pll_get_post($post_id, 'tr');

// Get translated term ID
$translated_term = pll_get_term($term_id, 'tr');

// Get home URL for a language
$tr_home = pll_home_url('tr');

// Register string for translation
pll_register_string('my-plugin-cta', 'Buy Now', 'My Plugin');

// Get translated string
$cta = pll__('Buy Now');
// Or: pll_e('Buy Now'); // echo version

// Language switcher
pll_the_languages(['display_names_as' => 'name', 'hide_if_no_translation' => 1]);

// Get all languages
$languages = pll_languages_list(['fields' => 'slug']); // ['en', 'tr', 'fr']
```

## Weglot Integration

```php
// Weglot is mostly automatic (translates on the fly)
// But you can exclude elements:
add_filter('weglot_get_regex_checkers', function ($regex_checkers) {
    $regex_checkers[] = new \Weglot\Parser\Check\Regex\RegexChecker('#data-no-translate#');
    return $regex_checkers;
});

// Exclude URLs
add_filter('weglot_get_url_excluders', function ($excluders) {
    $excluders[] = '/admin/';
    $excluders[] = '/api/';
    return $excluders;
});
```

## Hreflang Tags

```php
// Add hreflang for multilingual SEO
add_action('wp_head', function () {
    if (!function_exists('pll_the_languages') && !defined('ICL_SITEPRESS_VERSION')) {
        return; // No multilingual plugin
    }

    $languages = [];

    if (function_exists('pll_the_languages')) {
        // Polylang
        $raw = pll_the_languages(['raw' => 1]);
        foreach ($raw as $lang) {
            $languages[] = [
                'code' => $lang['slug'],
                'locale' => $lang['locale'],
                'url' => $lang['url'],
                'current' => $lang['current_lang'],
            ];
        }
    } elseif (defined('ICL_SITEPRESS_VERSION')) {
        // WPML
        $raw = apply_filters('wpml_active_languages', null, ['skip_missing' => 1]);
        foreach ($raw as $lang) {
            $languages[] = [
                'code' => $lang['code'],
                'locale' => $lang['default_locale'],
                'url' => $lang['url'],
                'current' => $lang['active'],
            ];
        }
    }

    foreach ($languages as $lang) {
        printf('<link rel="alternate" hreflang="%s" href="%s" />' . "\n",
            esc_attr($lang['locale']),
            esc_url($lang['url'])
        );
    }

    // x-default for language selector page
    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url(home_url('/')) . '" />' . "\n";
});
```

## RTL Support

```php
// WordPress auto-loads rtl.css if is_rtl() returns true
// Create style-rtl.css in your theme for RTL overrides

// Check RTL in templates
if (is_rtl()) {
    // Arabic, Hebrew, Persian, etc.
}

// Enqueue RTL stylesheet
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('mytheme', get_stylesheet_uri());
    wp_style_add_data('mytheme', 'rtl', 'replace'); // Loads style-rtl.css automatically
});

// Generate RTL CSS from LTR
// npm install rtlcss -g
// rtlcss style.css style-rtl.css
```

## Best Practices

1. **Use text domain consistently** — same domain in all `__()`, `_e()`, etc.
2. **Never concatenate translated strings** — `sprintf()` with `%s` placeholders
3. **Generate .pot file** — `wp i18n make-pot` for translators
4. **Add translator comments** — `/* translators: %s is the username */`
5. **Use hreflang tags** — critical for multilingual SEO
6. **Test RTL** — if supporting Arabic/Hebrew, test layout thoroughly
7. **Register dynamic strings** — options, theme mod values need explicit registration
8. **Use `date_i18n()`** — not `date()` for locale-aware dates
9. **Avoid inline text in HTML** — wrap everything in translation functions
10. **Test with a different locale** — switch to Turkish/German to catch untranslated strings
