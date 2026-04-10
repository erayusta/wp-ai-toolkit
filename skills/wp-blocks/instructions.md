# WordPress Block Development — Agent Skill

You are an expert WordPress block developer. Follow these guidelines for Gutenberg block development.

## block.json (Required Metadata)

Every block must have a `block.json` file:

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "my-plugin/my-block",
    "version": "1.0.0",
    "title": "My Block",
    "category": "widgets",
    "icon": "smiley",
    "description": "A custom block.",
    "keywords": ["custom", "example"],
    "textdomain": "my-plugin",
    "attributes": {
        "content": {
            "type": "string",
            "source": "html",
            "selector": "p"
        },
        "alignment": {
            "type": "string",
            "default": "left"
        }
    },
    "supports": {
        "html": false,
        "color": {
            "background": true,
            "text": true
        },
        "typography": {
            "fontSize": true
        },
        "spacing": {
            "margin": true,
            "padding": true
        }
    },
    "editorScript": "file:./index.js",
    "editorStyle": "file:./index.css",
    "style": "file:./style-index.css",
    "render": "file:./render.php"
}
```

## Block Registration (JavaScript)

```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

registerBlockType(metadata.name, {
    edit: ({ attributes, setAttributes }) => {
        const blockProps = useBlockProps();

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Settings', 'my-plugin')}>
                        <TextControl
                            label={__('Alignment', 'my-plugin')}
                            value={attributes.alignment}
                            onChange={(val) => setAttributes({ alignment: val })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps}>
                    <RichText
                        tagName="p"
                        value={attributes.content}
                        onChange={(content) => setAttributes({ content })}
                        placeholder={__('Write something...', 'my-plugin')}
                    />
                </div>
            </>
        );
    },
    save: ({ attributes }) => {
        const blockProps = useBlockProps.save();
        return (
            <div {...blockProps}>
                <RichText.Content tagName="p" value={attributes.content} />
            </div>
        );
    },
});
```

## Dynamic Blocks (Server-Side Render)

For blocks that render dynamically via PHP, use a `render.php`:

```php
<?php
// render.php — receives $attributes, $content, $block
$wrapper_attributes = get_block_wrapper_attributes();
?>
<div <?php echo $wrapper_attributes; ?>>
    <p><?php echo esc_html($attributes['content'] ?? ''); ?></p>
</div>
```

## PHP Block Registration

```php
function my_plugin_register_blocks() {
    register_block_type(__DIR__ . '/build/my-block');
}
add_action('init', 'my_plugin_register_blocks');
```

## Attribute Sources

| Source | Description | Example |
|--------|-------------|---------|
| `html` | Inner HTML of selector | `{ "source": "html", "selector": "p" }` |
| `attribute` | HTML attribute value | `{ "source": "attribute", "selector": "img", "attribute": "src" }` |
| `text` | Inner text of selector | `{ "source": "text", "selector": "figcaption" }` |
| `query` | Array from multiple elements | `{ "source": "query", "selector": "li" }` |
| _(none)_ | Stored in block comment delimiter | `{ "type": "string" }` |

## Block Supports

Key supports to know:
- `align` — Alignment toolbar (wide, full, left, right, center)
- `color` — Background and text color controls
- `typography` — Font size, line height, font family
- `spacing` — Margin and padding controls
- `anchor` — HTML anchor/ID field
- `className` — Additional CSS class field
- `html` — Allow HTML editing mode

## Best Practices

1. **Use `useBlockProps()`** — always, for proper block wrapper attributes
2. **Use `@wordpress/scripts`** — for build tooling (`wp-scripts build`)
3. **Internationalize** — use `__()` and `_x()` from `@wordpress/i18n`
4. **Validate attributes** — use proper types and defaults
5. **Use `render.php`** — for dynamic content that changes without re-saving
6. **Test with block validation** — ensure save output matches on reload
