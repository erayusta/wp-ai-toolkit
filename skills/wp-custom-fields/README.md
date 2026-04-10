# WP Custom Fields

> Work with ACF, CMB2, native meta API, and custom meta boxes

## What This Skill Covers

- Registering and retrieving post meta with the native meta API
- Building field groups with Advanced Custom Fields (ACF)
- Creating custom meta boxes with CMB2
- Exposing custom fields in the REST API and block editor

## Example Usage

Ask your AI assistant:

```
> "Register ACF fields for a real estate listing CPT on wordpress.test"
```

### Example Output

```php
// Register fields programmatically with ACF
add_action( 'acf/include_fields', function() {
    if ( ! function_exists( 'acf_add_local_field_group' ) ) {
        return;
    }

    acf_add_local_field_group( array(
        'key'      => 'group_listing_details',
        'title'    => 'Listing Details',
        'fields'   => array(
            array(
                'key'   => 'field_price',
                'label' => 'Price',
                'name'  => 'listing_price',
                'type'  => 'number',
                'prepend' => '$',
            ),
            array(
                'key'     => 'field_bedrooms',
                'label'   => 'Bedrooms',
                'name'    => 'listing_bedrooms',
                'type'    => 'select',
                'choices' => array( 1 => '1', 2 => '2', 3 => '3', 4 => '4', 5 => '5+' ),
            ),
            array(
                'key'   => 'field_sqft',
                'label' => 'Square Feet',
                'name'  => 'listing_sqft',
                'type'  => 'number',
            ),
            array(
                'key'   => 'field_gallery',
                'label' => 'Photo Gallery',
                'name'  => 'listing_gallery',
                'type'  => 'gallery',
            ),
        ),
        'location' => array(
            array(
                array(
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'listing',
                ),
            ),
        ),
    ) );
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates meta box and field registration code |
| `validate_php` | Checks field registration for errors |
| `analyze_database` | Inspects postmeta table for field storage |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
