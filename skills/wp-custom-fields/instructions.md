# WordPress Custom Fields — Agent Skill

You are an expert in WordPress custom fields, meta APIs, and popular field frameworks (ACF, CMB2, Pods).

## Native Meta API

### Post Meta
```php
// Save
update_post_meta($post_id, '_price', sanitize_text_field($value));

// Read
$price = get_post_meta($post_id, '_price', true);  // single value
$all   = get_post_meta($post_id);                   // all meta

// Delete
delete_post_meta($post_id, '_price');
```

### User Meta
```php
update_user_meta($user_id, 'phone', sanitize_text_field($phone));
$phone = get_user_meta($user_id, 'phone', true);
```

### Term Meta
```php
update_term_meta($term_id, 'icon', esc_url_raw($url));
$icon = get_term_meta($term_id, 'icon', true);
```

### Options API (site-wide settings)
```php
update_option('myplugin_api_key', sanitize_text_field($key));
$key = get_option('myplugin_api_key', '');  // second param = default
delete_option('myplugin_api_key');
```

## Custom Meta Boxes (Native)

```php
add_action('add_meta_boxes', function () {
    add_meta_box(
        'myplugin_details',                    // ID
        __('Product Details', 'my-plugin'),    // Title
        'myplugin_render_meta_box',            // Callback
        ['post', 'product'],                   // Screen (post types)
        'normal',                              // Context: normal, side, advanced
        'high'                                 // Priority: high, core, default, low
    );
});

function myplugin_render_meta_box($post) {
    wp_nonce_field('myplugin_save_meta', 'myplugin_nonce');
    $price = get_post_meta($post->ID, '_myplugin_price', true);
    $color = get_post_meta($post->ID, '_myplugin_color', true);
    ?>
    <p>
        <label for="myplugin_price"><?php esc_html_e('Price', 'my-plugin'); ?></label>
        <input type="number" id="myplugin_price" name="myplugin_price"
               value="<?php echo esc_attr($price); ?>" step="0.01" min="0">
    </p>
    <p>
        <label for="myplugin_color"><?php esc_html_e('Color', 'my-plugin'); ?></label>
        <select id="myplugin_color" name="myplugin_color">
            <option value="">— Select —</option>
            <option value="red" <?php selected($color, 'red'); ?>>Red</option>
            <option value="blue" <?php selected($color, 'blue'); ?>>Blue</option>
        </select>
    </p>
    <?php
}

add_action('save_post', function ($post_id) {
    if (!isset($_POST['myplugin_nonce']) || !wp_verify_nonce($_POST['myplugin_nonce'], 'myplugin_save_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    if (isset($_POST['myplugin_price'])) {
        update_post_meta($post_id, '_myplugin_price', sanitize_text_field($_POST['myplugin_price']));
    }
    if (isset($_POST['myplugin_color'])) {
        update_post_meta($post_id, '_myplugin_color', sanitize_text_field($_POST['myplugin_color']));
    }
});
```

## ACF (Advanced Custom Fields)

### Register Field Group (PHP)
```php
if (function_exists('acf_add_local_field_group')) {
    acf_add_local_field_group([
        'key'      => 'group_product_info',
        'title'    => 'Product Information',
        'fields'   => [
            ['key' => 'field_price', 'label' => 'Price', 'name' => 'price', 'type' => 'number', 'min' => 0, 'step' => 0.01],
            ['key' => 'field_gallery', 'label' => 'Gallery', 'name' => 'gallery', 'type' => 'gallery', 'return_format' => 'array'],
            ['key' => 'field_specs', 'label' => 'Specifications', 'name' => 'specs', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_spec_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text'],
                ['key' => 'field_spec_value', 'label' => 'Value', 'name' => 'value', 'type' => 'text'],
            ]],
            ['key' => 'field_related', 'label' => 'Related Products', 'name' => 'related', 'type' => 'relationship', 'post_type' => ['product']],
        ],
        'location' => [
            [['param' => 'post_type', 'operator' => '==', 'value' => 'product']],
        ],
    ]);
}
```

### ACF Template Functions
```php
// Simple field
$price = get_field('price', $post_id);

// Image field (returns array when return_format = array)
$image = get_field('hero_image');
if ($image) {
    echo '<img src="' . esc_url($image['url']) . '" alt="' . esc_attr($image['alt']) . '">';
}

// Repeater
if (have_rows('specs')) {
    while (have_rows('specs')) { the_row();
        echo esc_html(get_sub_field('label')) . ': ' . esc_html(get_sub_field('value'));
    }
}

// Flexible Content
if (have_rows('page_sections')) {
    while (have_rows('page_sections')) { the_row();
        switch (get_row_layout()) {
            case 'hero':    get_template_part('partials/hero'); break;
            case 'gallery': get_template_part('partials/gallery'); break;
            case 'cta':     get_template_part('partials/cta'); break;
        }
    }
}

// Group field
$address = get_field('address'); // returns array
echo esc_html($address['street']);

// Options page
$logo = get_field('site_logo', 'option');
```

### ACF in REST API
```php
// Expose ACF fields in REST API responses
add_filter('acf/settings/rest_api_format', function () {
    return 'standard'; // or 'light'
});

// Or manually register
register_rest_field('post', 'custom_fields', [
    'get_callback' => function ($post) {
        return [
            'price'   => get_field('price', $post['id']),
            'gallery' => get_field('gallery', $post['id']),
        ];
    },
]);
```

## CMB2 (Custom Meta Boxes 2)

```php
add_action('cmb2_admin_init', function () {
    $cmb = new_cmb2_box([
        'id'           => 'myplugin_product_metabox',
        'title'        => __('Product Details', 'my-plugin'),
        'object_types' => ['product'],
        'context'      => 'normal',
        'priority'     => 'high',
    ]);

    $cmb->add_field([
        'name' => __('Price', 'my-plugin'),
        'id'   => '_myplugin_price',
        'type' => 'text_money',
    ]);

    $cmb->add_field([
        'name'    => __('Color', 'my-plugin'),
        'id'      => '_myplugin_color',
        'type'    => 'colorpicker',
        'default' => '#ffffff',
    ]);

    // Repeatable group
    $group_id = $cmb->add_field([
        'id'      => '_myplugin_features',
        'type'    => 'group',
        'options' => ['group_title' => 'Feature {#}', 'add_button' => __('Add Feature', 'my-plugin')],
    ]);

    $cmb->add_group_field($group_id, [
        'name' => 'Title', 'id' => 'title', 'type' => 'text',
    ]);
    $cmb->add_group_field($group_id, [
        'name' => 'Description', 'id' => 'desc', 'type' => 'textarea_small',
    ]);
});

// Read CMB2 fields
$price    = get_post_meta($post_id, '_myplugin_price', true);
$features = get_post_meta($post_id, '_myplugin_features', true); // returns array
```

## Register Meta for REST API / Block Editor

```php
// Make meta available in block editor and REST API
register_post_meta('post', '_myplugin_subtitle', [
    'show_in_rest'      => true,
    'single'            => true,
    'type'              => 'string',
    'sanitize_callback' => 'sanitize_text_field',
    'auth_callback'     => function () { return current_user_can('edit_posts'); },
]);

// Use in block editor with useEntityProp
// const [meta, setMeta] = useEntityProp('postType', 'post', 'meta');
// const subtitle = meta._myplugin_subtitle;
```

## Field Types Reference

| Type | ACF | CMB2 | Native |
|------|-----|------|--------|
| Text | `text` | `text` | `<input type="text">` |
| Textarea | `textarea` | `textarea` | `<textarea>` |
| Number | `number` | `text` (validated) | `<input type="number">` |
| Email | `email` | `text_email` | `<input type="email">` |
| URL | `url` | `text_url` | `<input type="url">` |
| Image | `image` | `file` | MediaUpload |
| Gallery | `gallery` | `file_list` | Custom |
| Select | `select` | `select` | `<select>` |
| Checkbox | `true_false` | `checkbox` | `<input type="checkbox">` |
| WYSIWYG | `wysiwyg` | `wysiwyg` | `wp_editor()` |
| Date | `date_picker` | `text_date` | `<input type="date">` |
| Color | `color_picker` | `colorpicker` | `<input type="color">` |
| Repeater | `repeater` | `group` (repeatable) | Custom loop |
| Relationship | `relationship` | `post_search_ajax` | Custom |
| Flexible Content | `flexible_content` | N/A | Custom |

## Best Practices

1. **Prefix meta keys with underscore** — `_myplugin_*` hides from custom fields UI
2. **Always sanitize on save** — `sanitize_text_field()`, `absint()`, `esc_url_raw()`
3. **Always escape on output** — `esc_html()`, `esc_attr()`, `esc_url()`
4. **Verify nonces** — `wp_verify_nonce()` before saving any meta
5. **Check capabilities** — `current_user_can('edit_post', $post_id)`
6. **Use `register_post_meta()`** — for REST API / block editor integration
7. **Avoid `DOING_AUTOSAVE`** — check for autosave before saving meta
8. **Use ACF PHP registration** — for version control instead of DB-stored field groups
9. **Clean up on uninstall** — delete all custom meta in `uninstall.php`
10. **Use `show_in_rest`** — to expose fields to the block editor and REST API
