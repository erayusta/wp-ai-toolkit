# WP Themes

> Build block and classic themes with template hierarchy, theme.json, and FSE

## What This Skill Covers

- Creating block themes with theme.json global settings and styles
- Understanding and leveraging the template hierarchy
- Building Full Site Editing (FSE) templates and template parts
- Developing classic themes with proper template structure

## Example Usage

Ask your AI assistant:

```
> "Create a theme.json with custom typography and color palette for wordpress.test"
```

### Example Output

```json
{
    "$schema": "https://schemas.wp.org/trunk/theme.json",
    "version": 3,
    "settings": {
        "appearanceTools": true,
        "color": {
            "palette": [
                { "slug": "primary", "color": "#1e3a5f", "name": "Primary" },
                { "slug": "secondary", "color": "#e8491d", "name": "Secondary" },
                { "slug": "light", "color": "#f5f5f5", "name": "Light" },
                { "slug": "dark", "color": "#1a1a1a", "name": "Dark" }
            ]
        },
        "typography": {
            "fontFamilies": [
                {
                    "fontFamily": "'Inter', sans-serif",
                    "slug": "inter",
                    "name": "Inter",
                    "fontFace": [
                        { "fontFamily": "Inter", "fontWeight": "400", "fontStyle": "normal", "src": ["file:./assets/fonts/inter-regular.woff2"] },
                        { "fontFamily": "Inter", "fontWeight": "700", "fontStyle": "normal", "src": ["file:./assets/fonts/inter-bold.woff2"] }
                    ]
                }
            ],
            "fontSizes": [
                { "slug": "small", "size": "0.875rem", "name": "Small" },
                { "slug": "medium", "size": "1rem", "name": "Medium" },
                { "slug": "large", "size": "1.5rem", "name": "Large" },
                { "slug": "x-large", "size": "2.25rem", "name": "Extra Large" }
            ]
        },
        "layout": {
            "contentSize": "720px",
            "wideSize": "1200px"
        }
    },
    "styles": {
        "color": { "background": "var(--wp--preset--color--light)", "text": "var(--wp--preset--color--dark)" },
        "typography": { "fontFamily": "var(--wp--preset--font-family--inter)", "fontSize": "var(--wp--preset--font-size--medium)" },
        "elements": {
            "heading": { "typography": { "fontWeight": "700" } },
            "link": { "color": { "text": "var(--wp--preset--color--primary)" } }
        }
    }
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_theme` | Audits theme structure and template hierarchy |
| `validate_json` | Validates theme.json against the WordPress schema |
| `scaffold_component` | Generates theme templates and template parts |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
