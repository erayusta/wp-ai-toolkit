# WP Gutenberg Components

> Build with Block Editor React components, RichText, InnerBlocks, and data stores

## What This Skill Covers

- Using RichText, MediaUpload, and InspectorControls components
- Implementing InnerBlocks with allowedBlocks and templates
- Accessing and manipulating block editor data stores
- Creating custom block editor sidebar panels and plugins

## Example Usage

Ask your AI assistant:

```
> "Build a block edit component with RichText, color settings, and InnerBlocks on wordpress.test"
```

### Example Output

```jsx
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';

export default function Edit({ attributes, setAttributes }) {
    const { heading, columns } = attributes;
    const blockProps = useBlockProps({ className: `columns-${columns}` });

    const ALLOWED_BLOCKS = ['core/paragraph', 'core/image', 'core/button'];
    const TEMPLATE = [
        ['core/paragraph', { placeholder: 'Add content...' }],
    ];

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Layout Settings', 'myplugin')}>
                    <RangeControl
                        label={__('Columns', 'myplugin')}
                        value={columns}
                        onChange={(val) => setAttributes({ columns: val })}
                        min={1}
                        max={4}
                    />
                </PanelBody>
            </InspectorControls>
            <div {...blockProps}>
                <RichText
                    tagName="h2"
                    value={heading}
                    onChange={(val) => setAttributes({ heading: val })}
                    placeholder={__('Section Heading', 'myplugin')}
                />
                <InnerBlocks
                    allowedBlocks={ALLOWED_BLOCKS}
                    template={TEMPLATE}
                    templateLock={false}
                />
            </div>
        </>
    );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates block edit/save components |
| `build_assets` | Compiles JSX with @wordpress/scripts |
| `validate_json` | Checks block.json for component dependencies |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
