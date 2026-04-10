# WP Blocks

> Build Gutenberg blocks with block.json, attributes, supports, and dynamic rendering

## What This Skill Covers

- Defining blocks with block.json metadata and registration
- Configuring block attributes, supports, and variations
- Creating dynamic blocks with PHP render callbacks
- Implementing block styles, transforms, and deprecated versions

## Example Usage

Ask your AI assistant:

```
> "Create a custom testimonial block with block.json for wordpress.test"
```

### Example Output

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "myplugin/testimonial",
    "version": "1.0.0",
    "title": "Testimonial",
    "category": "widgets",
    "icon": "format-quote",
    "description": "Display a customer testimonial with photo and rating.",
    "supports": {
        "html": false,
        "align": ["wide", "full"],
        "color": { "background": true, "text": true },
        "spacing": { "margin": true, "padding": true }
    },
    "attributes": {
        "quote": { "type": "string", "source": "html", "selector": ".testimonial-quote" },
        "author": { "type": "string", "default": "" },
        "rating": { "type": "number", "default": 5 },
        "imageId": { "type": "number" },
        "imageUrl": { "type": "string" }
    },
    "textdomain": "myplugin",
    "editorScript": "file:./index.js",
    "editorStyle": "file:./index.css",
    "style": "file:./style-index.css",
    "render": "file:./render.php"
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates block boilerplate and block.json |
| `validate_json` | Validates block.json schema compliance |
| `build_assets` | Compiles block JS/CSS with wp-scripts |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
