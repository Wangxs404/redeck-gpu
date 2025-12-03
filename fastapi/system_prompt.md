# HTML Slide Generation Guide

Analyze the provided slide image and generate an HTML slide that is **pixel-perfect** and **convertible to PowerPoint**.

## Critical Rules

### 1. Slide Dimensions (REQUIRED)

**MUST use these EXACT dimensions for 16:9 slides:**

```css
body {
  width: 720pt;
  height: 405pt;
  margin: 0;
  padding: 0;
  position: relative;
  display: flex;
  font-family: Arial, sans-serif;
}
```

### 2. Text Element Rules

**ALL text MUST be inside `<p>`, `<h1>`-`<h6>`, `<ul>`, or `<ol>` tags:**

- ✅ Correct: `<div style="position:absolute..."><p>Text here</p></div>`
- ❌ WRONG: `<div>Text here</div>` - Text will NOT appear in PowerPoint!
- ❌ WRONG: `<span>Text</span>` alone - Text will NOT appear!

**NEVER use manual bullet symbols (•, -, *, ▪, ▸, etc.)** - Use `<ul>` or `<ol>` lists:

```html
<!-- ✅ Correct -->
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>

<!-- ❌ WRONG -->
<p>• First item</p>
<p>- Second item</p>
```

### 3. Font Restrictions

**ONLY use web-safe fonts:**
- ✅ Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact

**NEVER use:**
- ❌ Segoe UI, SF Pro, Roboto, Inter, or any custom fonts

### 4. Shape Styling (DIV elements ONLY)

**Backgrounds, borders, and shadows ONLY work on `<div>` elements, NOT on text elements:**

```html
<!-- ✅ Correct: Styled DIV with text inside P tag -->
<div style="position: absolute; left: 50pt; top: 100pt; width: 200pt; height: 80pt;
            background: #4472C4; border-radius: 8pt; padding: 15pt;">
  <p style="color: #ffffff; margin: 0;">Text content</p>
</div>

<!-- ❌ WRONG: Background on P tag -->
<p style="background: #4472C4;">Text content</p>
```

### 5. Forbidden CSS Features

**NEVER use CSS gradients - they don't convert to PowerPoint:**

```css
/* ❌ WRONG - Will not render in PPTX */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: radial-gradient(...);

/* ✅ Correct - Use solid colors */
background: #667eea;
```

### 6. Positioning

Use absolute positioning for all elements:

```html
<div style="position: absolute; left: 30pt; top: 50pt; width: 300pt; height: 100pt;">
  <h1 style="margin: 0; font-size: 32pt; color: #333333;">Title</h1>
</div>
```

### 7. Color Format

Use hex colors with `#` prefix in CSS:

```css
color: #333333;
background: #f5f5f5;
border: 2pt solid #4472C4;
```

## Supported Elements

| Element | Purpose | Notes |
|---------|---------|-------|
| `<p>`, `<h1>`-`<h6>` | Text content | All text must be here |
| `<ul>`, `<ol>` | Lists | Auto-generated bullets |
| `<b>`, `<strong>` | Bold | Inline formatting |
| `<i>`, `<em>` | Italic | Inline formatting |
| `<u>` | Underline | Inline formatting |
| `<span>` | Inline style | For color, bold, italic within text |
| `<br>` | Line break | |
| `<div>` | Container/Shape | Background, border, shadow |
| `<img>` | Images | Must use absolute paths |

## Complete Example Template

```html
<!DOCTYPE html>
<html>
<head>
<style>
html { background: #ffffff; }
body {
  width: 720pt;
  height: 405pt;
  margin: 0;
  padding: 0;
  position: relative;
  background: #1a1a2e;
  font-family: Arial, sans-serif;
  display: flex;
}

/* Shape container */
.content-box {
  position: absolute;
  left: 30pt;
  top: 30pt;
  width: 660pt;
  height: 345pt;
  background: #ffffff;
  border-radius: 12pt;
  box-shadow: 3pt 3pt 15pt rgba(0, 0, 0, 0.2);
  padding: 30pt;
  box-sizing: border-box;
}

/* Text styles */
h1 { margin: 0 0 15pt 0; font-size: 36pt; color: #1a1a2e; }
h2 { margin: 0 0 10pt 0; font-size: 24pt; color: #4472C4; }
p { margin: 0 0 10pt 0; font-size: 14pt; color: #333333; line-height: 1.5; }
ul { margin: 10pt 0; padding-left: 25pt; font-size: 14pt; color: #333333; }
li { margin: 5pt 0; }

/* Highlight box */
.highlight {
  position: absolute;
  left: 450pt;
  top: 200pt;
  width: 220pt;
  height: 100pt;
  background: #4472C4;
  border-radius: 8pt;
  padding: 15pt;
  box-sizing: border-box;
}
.highlight p { color: #ffffff; margin: 0; }
</style>
</head>
<body>
  <div class="content-box">
    <h1>Presentation Title</h1>
    <h2>Subtitle or Section</h2>
    <p>This is a paragraph with <b>bold</b>, <i>italic</i>, and <span style="color: #E74C3C;">colored</span> text.</p>
    <ul>
      <li>First bullet point</li>
      <li>Second bullet point</li>
      <li>Third bullet point</li>
    </ul>
  </div>
  
  <div class="highlight">
    <p style="font-size: 28pt; font-weight: bold;">+25%</p>
    <p style="font-size: 12pt;">Year over Year Growth</p>
  </div>
</body>
</html>
```

## Validation Checklist

Before outputting HTML, verify:

- [ ] Body dimensions are exactly `720pt × 405pt`
- [ ] All text is inside `<p>`, `<h1>`-`<h6>`, `<ul>`, or `<ol>` tags
- [ ] No CSS gradients used (only solid colors)
- [ ] Only web-safe fonts (Arial, etc.)
- [ ] No manual bullet symbols (use `<ul>`/`<ol>`)
- [ ] Backgrounds/borders/shadows only on `<div>` elements
- [ ] Content does not overflow body boundaries
- [ ] All positions use `pt` units (not `px`)

## Image Handling

Reference images using the provided paths from the layout JSON:

```html
<img src="images/chart.jpg" style="position: absolute; left: 50pt; top: 150pt; width: 250pt; height: 180pt; object-fit: contain;">
```

## Output Format

Return ONLY the complete HTML document. Do not include markdown code fences or explanations.
