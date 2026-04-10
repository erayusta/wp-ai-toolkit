# WordPress Page Builders — Agent Skill

You are an expert in extending WordPress page builders: Elementor, Divi, Beaver Builder, and WPBakery.

## Elementor — Custom Widget

```php
<?php
// my-plugin/widgets/class-my-widget.php

class My_Custom_Widget extends \Elementor\Widget_Base {

    public function get_name() { return 'my_custom_widget'; }
    public function get_title() { return __('My Widget', 'my-plugin'); }
    public function get_icon() { return 'eicon-code'; }
    public function get_categories() { return ['general']; }
    public function get_keywords() { return ['custom', 'widget', 'my-plugin']; }

    protected function register_controls() {
        // Content Tab
        $this->start_controls_section('content_section', [
            'label' => __('Content', 'my-plugin'),
            'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
        ]);

        $this->add_control('title', [
            'label'   => __('Title', 'my-plugin'),
            'type'    => \Elementor\Controls_Manager::TEXT,
            'default' => __('Hello World', 'my-plugin'),
        ]);

        $this->add_control('description', [
            'label' => __('Description', 'my-plugin'),
            'type'  => \Elementor\Controls_Manager::WYSIWYG,
        ]);

        $this->add_control('image', [
            'label'   => __('Image', 'my-plugin'),
            'type'    => \Elementor\Controls_Manager::MEDIA,
            'default' => ['url' => \Elementor\Utils::get_placeholder_image_src()],
        ]);

        $this->add_control('link', [
            'label'       => __('Link', 'my-plugin'),
            'type'        => \Elementor\Controls_Manager::URL,
            'placeholder' => 'https://example.com',
        ]);

        $this->add_control('layout', [
            'label'   => __('Layout', 'my-plugin'),
            'type'    => \Elementor\Controls_Manager::SELECT,
            'default' => 'horizontal',
            'options' => [
                'horizontal' => __('Horizontal', 'my-plugin'),
                'vertical'   => __('Vertical', 'my-plugin'),
            ],
        ]);

        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section('style_section', [
            'label' => __('Style', 'my-plugin'),
            'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('title_color', [
            'label'     => __('Title Color', 'my-plugin'),
            'type'      => \Elementor\Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .widget-title' => 'color: {{VALUE}};'],
        ]);

        $this->add_group_control(\Elementor\Group_Control_Typography::get_type(), [
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .widget-title',
        ]);

        $this->add_responsive_control('padding', [
            'label'      => __('Padding', 'my-plugin'),
            'type'       => \Elementor\Controls_Manager::DIMENSIONS,
            'size_units' => ['px', 'em', '%'],
            'selectors'  => ['{{WRAPPER}} .widget-wrap' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="widget-wrap layout-<?php echo esc_attr($settings['layout']); ?>">
            <h3 class="widget-title"><?php echo esc_html($settings['title']); ?></h3>
            <?php if (!empty($settings['image']['url'])): ?>
                <img src="<?php echo esc_url($settings['image']['url']); ?>" alt="">
            <?php endif; ?>
            <div class="widget-desc"><?php echo wp_kses_post($settings['description']); ?></div>
        </div>
        <?php
    }
}

// Register widget
add_action('elementor/widgets/register', function ($widgets_manager) {
    require_once __DIR__ . '/widgets/class-my-widget.php';
    $widgets_manager->register(new My_Custom_Widget());
});
```

### Elementor Control Types

| Control | Type Constant | Description |
|---------|--------------|-------------|
| Text | `TEXT` | Single-line text input |
| Textarea | `TEXTAREA` | Multi-line text |
| WYSIWYG | `WYSIWYG` | Rich text editor |
| Number | `NUMBER` | Numeric input |
| URL | `URL` | Link with target/nofollow |
| Media | `MEDIA` | Image/file picker |
| Select | `SELECT` | Dropdown select |
| Select2 | `SELECT2` | Searchable multi-select |
| Switcher | `SWITCHER` | Toggle on/off |
| Slider | `SLIDER` | Range slider |
| Dimensions | `DIMENSIONS` | Top/Right/Bottom/Left |
| Color | `COLOR` | Color picker |
| Icons | `ICONS` | Icon picker |
| Repeater | `REPEATER` | Repeatable fields group |
| Choose | `CHOOSE` | Icon radio buttons |

### Elementor Dynamic Tags

```php
// Register dynamic tag
add_action('elementor/dynamic_tags/register', function ($tags_manager) {
    $tags_manager->register(new class extends \Elementor\Core\DynamicTags\Tag {
        public function get_name() { return 'my_dynamic_price'; }
        public function get_title() { return 'Product Price'; }
        public function get_group() { return 'my-plugin'; }
        public function get_categories() { return [\Elementor\Modules\DynamicTags\Module::TEXT_CATEGORY]; }
        public function render() {
            $price = get_post_meta(get_the_ID(), '_price', true);
            echo esc_html($price ? '$' . $price : 'N/A');
        }
    });
});
```

## Divi — Custom Module

```php
<?php
// my-plugin/includes/modules/MyModule/MyModule.php

class MyPlugin_MyModule extends ET_Builder_Module {
    public $slug       = 'myplugin_my_module';
    public $vb_support = 'on';

    public function init() {
        $this->name = esc_html__('My Module', 'my-plugin');
        $this->icon = 'N'; // Divi icon font character
    }

    public function get_fields() {
        return [
            'title' => [
                'label'       => esc_html__('Title', 'my-plugin'),
                'type'        => 'text',
                'toggle_slug' => 'main_content',
            ],
            'content' => [
                'label'       => esc_html__('Content', 'my-plugin'),
                'type'        => 'tiny_mce',
                'toggle_slug' => 'main_content',
            ],
            'background_color' => [
                'label'       => esc_html__('Background', 'my-plugin'),
                'type'        => 'color-alpha',
                'toggle_slug' => 'design',
                'tab_slug'    => 'advanced',
            ],
        ];
    }

    public function render($attrs, $content, $render_slug) {
        return sprintf(
            '<div class="myplugin-module" style="background-color:%s">
                <h3>%s</h3>
                <div>%s</div>
            </div>',
            esc_attr($this->props['background_color'] ?? ''),
            esc_html($this->props['title']),
            wp_kses_post($this->props['content'])
        );
    }
}

// Register
add_action('et_builder_ready', function () {
    if (class_exists('ET_Builder_Module')) {
        new MyPlugin_MyModule();
    }
});
```

## Beaver Builder — Custom Module

```php
<?php
// my-plugin/modules/my-module/my-module.php

class MyPlugin_BB_Module extends FLBuilderModule {
    public function __construct() {
        parent::__construct([
            'name'          => __('My Module', 'my-plugin'),
            'description'   => __('A custom module.', 'my-plugin'),
            'category'      => __('My Plugin', 'my-plugin'),
            'dir'           => __DIR__,
            'url'           => plugin_dir_url(__FILE__),
            'icon'          => 'button.svg',
        ]);
    }
}

FLBuilder::register_module('MyPlugin_BB_Module', [
    'general' => [
        'title'    => __('General', 'my-plugin'),
        'sections' => [
            'content' => [
                'title'  => __('Content', 'my-plugin'),
                'fields' => [
                    'title' => [
                        'type'    => 'text',
                        'label'   => __('Title', 'my-plugin'),
                        'default' => 'Hello World',
                    ],
                    'description' => [
                        'type'  => 'editor',
                        'label' => __('Description', 'my-plugin'),
                    ],
                    'photo' => [
                        'type'  => 'photo',
                        'label' => __('Photo', 'my-plugin'),
                    ],
                ],
            ],
        ],
    ],
]);
```

```php
<!-- modules/my-module/includes/frontend.php -->
<div class="my-module">
    <h3><?php echo esc_html($settings->title); ?></h3>
    <?php if ($settings->photo): ?>
        <img src="<?php echo esc_url($settings->photo_src); ?>" alt="">
    <?php endif; ?>
    <div><?php echo wp_kses_post($settings->description); ?></div>
</div>
```

## WPBakery (Visual Composer) — Custom Element

```php
add_action('vc_before_init', function () {
    vc_map([
        'name'     => __('My Element', 'my-plugin'),
        'base'     => 'myplugin_element',
        'category' => __('My Plugin', 'my-plugin'),
        'icon'     => 'icon-wpb-layer-shape-text',
        'params'   => [
            ['type' => 'textfield', 'heading' => __('Title', 'my-plugin'), 'param_name' => 'title'],
            ['type' => 'textarea_html', 'heading' => __('Content', 'my-plugin'), 'param_name' => 'content'],
            ['type' => 'attach_image', 'heading' => __('Image', 'my-plugin'), 'param_name' => 'image'],
            ['type' => 'dropdown', 'heading' => __('Style', 'my-plugin'), 'param_name' => 'style',
             'value' => ['Default' => 'default', 'Modern' => 'modern', 'Classic' => 'classic']],
            ['type' => 'colorpicker', 'heading' => __('Color', 'my-plugin'), 'param_name' => 'color'],
        ],
    ]);
});

add_shortcode('myplugin_element', function ($atts, $content = null) {
    $atts = shortcode_atts(['title' => '', 'image' => '', 'style' => 'default', 'color' => ''], $atts);
    $img_url = wp_get_attachment_image_url($atts['image'], 'large');

    ob_start(); ?>
    <div class="myplugin-el style-<?php echo esc_attr($atts['style']); ?>">
        <h3 style="color:<?php echo esc_attr($atts['color']); ?>"><?php echo esc_html($atts['title']); ?></h3>
        <?php if ($img_url): ?><img src="<?php echo esc_url($img_url); ?>" alt=""><?php endif; ?>
        <div><?php echo wp_kses_post($content); ?></div>
    </div>
    <?php return ob_get_clean();
});
```

## Best Practices

1. **Check builder is active** — `if (did_action('elementor/loaded'))`, `if (class_exists('ET_Builder_Module'))`, `if (class_exists('FLBuilder'))`
2. **Use builder-native controls** — don't build custom UI, use their control systems
3. **Escape all output** — `esc_html()`, `esc_attr()`, `esc_url()` in render methods
4. **Support responsive** — use `add_responsive_control()` in Elementor
5. **Register properly** — use the builder's registration hooks, not custom post_type hacks
6. **Lazy-load assets** — only enqueue CSS/JS when your widget is on the page
7. **Support Visual Builder** — Divi `vb_support = 'on'`, Elementor live preview
8. **Namespace everything** — prefix widget names, CSS classes, asset handles
9. **Multi-builder support** — if targeting multiple builders, use a factory pattern
10. **Test in both editors** — frontend editor AND backend editor behave differently
