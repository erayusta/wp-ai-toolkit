# WordPress Gutenberg Components — Agent Skill

You are an expert in WordPress Block Editor (Gutenberg) component development using React and `@wordpress/*` packages.

## Core Packages

| Package | Purpose |
|---------|---------|
| `@wordpress/blocks` | Block registration, serialization, parsing |
| `@wordpress/block-editor` | Block editing UI (RichText, InnerBlocks, InspectorControls) |
| `@wordpress/components` | Reusable UI components (Button, TextControl, PanelBody) |
| `@wordpress/data` | State management (Redux-like stores) |
| `@wordpress/element` | React wrapper (createElement, useState, useEffect) |
| `@wordpress/i18n` | Internationalization (__(), _n(), sprintf()) |
| `@wordpress/hooks` | Filter/action system in JavaScript |
| `@wordpress/api-fetch` | WordPress REST API client |
| `@wordpress/compose` | Higher-order components and hooks |

## Block Registration

```js
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('my-plugin/hero', {
    edit({ attributes, setAttributes }) {
        const blockProps = useBlockProps({ className: 'hero-block' });
        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Settings', 'my-plugin')}>
                        <ToggleControl
                            label={__('Show overlay', 'my-plugin')}
                            checked={attributes.showOverlay}
                            onChange={(val) => setAttributes({ showOverlay: val })}
                        />
                        <SelectControl
                            label={__('Layout', 'my-plugin')}
                            value={attributes.layout}
                            options={[
                                { label: 'Full Width', value: 'full' },
                                { label: 'Contained', value: 'contained' },
                            ]}
                            onChange={(val) => setAttributes({ layout: val })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div {...blockProps}>
                    <RichText
                        tagName="h2"
                        value={attributes.heading}
                        onChange={(val) => setAttributes({ heading: val })}
                        placeholder={__('Enter heading…', 'my-plugin')}
                    />
                </div>
            </>
        );
    },
    save({ attributes }) {
        const blockProps = useBlockProps.save();
        return (
            <div {...blockProps}>
                <RichText.Content tagName="h2" value={attributes.heading} />
            </div>
        );
    },
});
```

## Key Editor Components

### RichText
```js
<RichText
    tagName="p"
    value={attributes.content}
    onChange={(content) => setAttributes({ content })}
    allowedFormats={['core/bold', 'core/italic', 'core/link']}
    placeholder="Type here…"
/>
// Save: <RichText.Content tagName="p" value={attributes.content} />
```

### InnerBlocks
```js
import { InnerBlocks, useInnerBlocksProps } from '@wordpress/block-editor';

const ALLOWED = ['core/paragraph', 'core/image', 'core/heading'];
const TEMPLATE = [
    ['core/heading', { level: 2, placeholder: 'Title' }],
    ['core/paragraph', { placeholder: 'Description…' }],
];

function Edit() {
    const blockProps = useBlockProps();
    const innerBlocksProps = useInnerBlocksProps(blockProps, {
        allowedBlocks: ALLOWED,
        template: TEMPLATE,
        templateLock: false, // false | 'all' | 'insert' | 'contentOnly'
    });
    return <div {...innerBlocksProps} />;
}
```

### InspectorControls (Sidebar)
```js
import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, RangeControl, TextControl } from '@wordpress/components';

<InspectorControls>
    <PanelBody title="Layout" initialOpen={true}>
        <RangeControl label="Columns" value={columns} onChange={setColumns} min={1} max={4} />
        <TextControl label="CSS Class" value={className} onChange={setClassName} />
    </PanelBody>
    <PanelColorSettings
        title="Colors"
        colorSettings={[
            { value: bgColor, onChange: setBgColor, label: 'Background' },
        ]}
    />
</InspectorControls>
```

### BlockControls (Toolbar)
```js
import { BlockControls, AlignmentToolbar } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';

<BlockControls>
    <AlignmentToolbar value={alignment} onChange={setAlignment} />
    <ToolbarGroup>
        <ToolbarButton icon={formatBold} label="Bold" onClick={toggleBold} isActive={isBold} />
    </ToolbarGroup>
</BlockControls>
```

### MediaUpload
```js
import { MediaUpload, MediaUploadCheck, MediaPlaceholder } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

<MediaUploadCheck>
    <MediaUpload
        onSelect={(media) => setAttributes({ imageId: media.id, imageUrl: media.url })}
        allowedTypes={['image']}
        value={attributes.imageId}
        render={({ open }) => <Button onClick={open}>Upload Image</Button>}
    />
</MediaUploadCheck>
```

## Data Store (wp.data)

```js
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

const posts = useSelect((select) =>
    select(coreStore).getEntityRecords('postType', 'post', { per_page: 5 }),
[]);

const { editPost, savePost } = useDispatch(editorStore);
```

## Dynamic Blocks (Server-Side Render)

```js
import ServerSideRender from '@wordpress/server-side-render';

function Edit({ attributes }) {
    return <ServerSideRender block="my-plugin/recent-posts" attributes={attributes} />;
}

registerBlockType('my-plugin/recent-posts', {
    edit: Edit,
    save: () => null, // rendered by PHP render_callback or render.php
});
```

## Block Variations & Styles

```js
import { registerBlockVariation, registerBlockStyle } from '@wordpress/blocks';

registerBlockVariation('core/group', {
    name: 'my-plugin/card',
    title: 'Card',
    attributes: { className: 'is-style-card' },
    innerBlocks: [['core/heading', { level: 3 }], ['core/paragraph']],
    scope: ['inserter'],
});

registerBlockStyle('core/button', { name: 'rounded', label: 'Rounded' });
```

## Plugin Sidebar (SlotFill)

```js
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';

registerPlugin('my-plugin-sidebar', {
    render() {
        return (
            <>
                <PluginSidebarMoreMenuItem target="my-sidebar">My Plugin</PluginSidebarMoreMenuItem>
                <PluginSidebar name="my-sidebar" title="My Plugin">
                    <PanelBody>{ /* content */ }</PanelBody>
                </PluginSidebar>
            </>
        );
    },
});
```

## Build Toolchain

```bash
npx @wordpress/create-block my-block   # scaffold new block
cd my-block
npm start      # dev with hot reload
npm run build  # production build
```

## Best Practices

1. **Always use `useBlockProps()`** — required for block wrapper
2. **Use `block.json`** for metadata — not inline `registerBlockType()` args
3. **Use `@wordpress/scripts`** — don't configure webpack manually
4. **Prefer dynamic blocks** — `render.php` for server-side output
5. **Use `InnerBlocks`** — for container blocks instead of custom layouts
6. **Use block supports** — `color`, `typography`, `spacing` via `block.json`
7. **Internationalize** — all strings with `@wordpress/i18n`
8. **Use `useSelect`/`useDispatch`** — not `wp.data.select()` directly
9. **Register block styles** — for visual variations, not separate blocks
10. **Lazy-load heavy components** — dynamic import for large UIs
