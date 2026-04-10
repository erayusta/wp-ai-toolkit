# WP Popular Themes

> Customize Astra, GeneratePress, and OceanWP with hooks, filters, and child themes

## What This Skill Covers

- Using Astra hooks and filters for header, footer, and layout customization
- Extending GeneratePress with its element system and hooks
- Customizing OceanWP with its extensive filter library
- Building child themes for safe, upgrade-proof modifications

## Example Usage

Ask your AI assistant:

```
> "Customize the Astra theme header and add a top bar on wordpress.test"
```

### Example Output

```php
// Child theme functions.php for Astra customization

// Add a top bar above the header
add_action( 'astra_header_before', 'add_top_announcement_bar' );

function add_top_announcement_bar() {
    ?>
    <div class="top-bar" style="background: #1e3a5f; color: #fff; text-align: center; padding: 8px 0; font-size: 14px;">
        <?php echo wp_kses_post( get_theme_mod( 'top_bar_text', 'Free shipping on orders over $50!' ) ); ?>
    </div>
    <?php
}

// Customize the Astra header layout via filter
add_filter( 'astra_header_layout', function() {
    return 'header-main-layout-3'; // Logo left, menu right, search icon
} );

// Add phone number to the header right section
add_action( 'astra_header_after', 'add_header_phone' );

function add_header_phone() {
    ?>
    <div class="header-phone" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%);">
        <a href="tel:+15551234567" style="color: inherit; text-decoration: none;">
            <span class="dashicons dashicons-phone"></span> (555) 123-4567
        </a>
    </div>
    <?php
}

// Register the top bar text in the Customizer
add_action( 'customize_register', function( $wp_customize ) {
    $wp_customize->add_setting( 'top_bar_text', array(
        'default'           => 'Free shipping on orders over $50!',
        'sanitize_callback' => 'wp_kses_post',
    ) );

    $wp_customize->add_control( 'top_bar_text', array(
        'label'   => __( 'Top Bar Text', 'mytheme-child' ),
        'section' => 'title_tagline',
        'type'    => 'text',
    ) );
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_theme` | Detects active theme and available hooks |
| `scaffold_component` | Generates child theme with proper headers |
| `validate_php` | Checks child theme functions for errors |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
