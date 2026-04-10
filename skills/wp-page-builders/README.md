# WP Page Builders

> Build Elementor widgets, Divi modules, Beaver Builder modules, and WPBakery elements

## What This Skill Covers

- Creating custom Elementor widgets with controls and rendering
- Building Divi Builder custom modules with fields
- Developing Beaver Builder modules with settings forms
- Extending WPBakery with custom shortcode elements

## Example Usage

Ask your AI assistant:

```
> "Create a custom Elementor widget for pricing cards on wordpress.test"
```

### Example Output

```php
class Pricing_Card_Widget extends \Elementor\Widget_Base {

    public function get_name() { return 'pricing_card'; }
    public function get_title() { return esc_html__( 'Pricing Card', 'myplugin' ); }
    public function get_icon() { return 'eicon-price-table'; }
    public function get_categories() { return [ 'general' ]; }

    protected function register_controls() {
        $this->start_controls_section( 'content_section', [
            'label' => esc_html__( 'Content', 'myplugin' ),
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'plan_name', [
            'label'   => esc_html__( 'Plan Name', 'myplugin' ),
            'type'    => \Elementor\Controls_Manager::TEXT,
            'default' => 'Pro Plan',
        ] );

        $this->add_control( 'price', [
            'label'   => esc_html__( 'Price', 'myplugin' ),
            'type'    => \Elementor\Controls_Manager::TEXT,
            'default' => '$29/mo',
        ] );

        $this->add_control( 'features', [
            'label'   => esc_html__( 'Features', 'myplugin' ),
            'type'    => \Elementor\Controls_Manager::TEXTAREA,
            'default' => "10 Projects\nUnlimited Storage\nPriority Support",
        ] );

        $this->end_controls_section();
    }

    protected function render() {
        $s = $this->get_settings_for_display();
        $features = explode( "\n", $s['features'] );
        ?>
        <div class="pricing-card">
            <h3 class="pricing-card__title"><?php echo esc_html( $s['plan_name'] ); ?></h3>
            <div class="pricing-card__price"><?php echo esc_html( $s['price'] ); ?></div>
            <ul class="pricing-card__features">
                <?php foreach ( $features as $feat ) : ?>
                    <li><?php echo esc_html( trim( $feat ) ); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php
    }
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates page builder widget boilerplate |
| `validate_php` | Checks widget class structure and controls |
| `analyze_theme` | Detects active page builder and version |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
