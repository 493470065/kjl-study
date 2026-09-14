# Winning Health (卫宁健康) Template - Design Specification

> A distinctive design blending healthcare industry professionalism with modern corporate elegance.

***

## I. Template Overview

| Property               | Description                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Template Name**      | Winning Health (卫宁健康)                                                                            |
| **Use Cases**          | Corporate presentations, healthcare industry reports, strategic planning, business meetings      |
| **Design Tone**        | Professional · Trustworthy · Modern corporate style                                              |
| **Design Inspiration** | Healthcare industry characteristics + corporate brand identity + modern business professionalism |

### Design Features

1. **Rectangular Layout**: Clean rectangular color blocks provide a professional and structured appearance
2. **Asymmetric Aesthetics**: Left-heavy visual balance guides reading focus
3. **Gradient Color Bands**: Deep-to-light transitions symbolize professional trust and corporate stability
4. **Wave Patterns**: Abstract flowing elements representing healthcare and innovation

***

## II. Canvas Specification

| Property              | Value                            |
| --------------------- | -------------------------------- |
| **Format**            | Standard 16:9                    |
| **Dimensions**        | 1280 × 720 px                    |
| **viewBox**           | `0 0 1280 720`                   |
| **Page Margins**      | Left/right 60px, top/bottom 40px |
| **Content Safe Area** | x: 60-1220, y: 100-660           |

***

## III. Color Scheme

### Primary Colors (Extracted from Logo)

| Role                 | Value     | Notes                                              |
| -------------------- | --------- | -------------------------------------------------- |
| **Winning Blue**     | `#006BB7` | Brand primary color; header, titles, main elements |
| **Deep Blue**        | `#004A82` | Chapter page background, emphasis areas            |
| **Sky Blue**         | `#3A9BD9` | Accent color, gradient endpoint                    |
| **Cloud Blue**       | `#E3F2FD` | Light background, card base color                  |
| **Golden Accent**    | `#D4A84B` | Decorative accents, highlights                     |
| **Background White** | `#FAFCFF` | Subtly blue-tinted pure white                      |

### Text Colors

| Role               | Value     | Usage                     |
| ------------------ | --------- | ------------------------- |
| **Dark Ink Text**  | `#1A2E44` | Main titles, heading text |
| **Primary Text**   | `#333D4A` | Body content              |
| **Secondary Text** | `#6B7B8C` | Captions, annotations     |
| **White Text**     | `#FFFFFF` | Text on dark backgrounds  |

### Gradient Scheme

```
Primary gradient: #004A82 �?#006BB7 �?#3A9BD9 (deep �?light, used for background diagonal cuts)
Gold gradient: #C49A3D �?#D4A84B �?#E8C675 (decorative use)
```

***

## IV. Typography System

### Font Stack

**Font Stack**: `"Microsoft YaHei", "微软雅黑", "PingFang SC", Arial, sans-serif`

### Font Size Hierarchy

| Level | Usage                 | Size | Weight  | Notes               |
| ----- | --------------------- | ---- | ------- | ------------------- |
| H1    | Cover main title      | 48px | Bold    | Grand and dignified |
| H2    | Page title            | 32px | Bold    | <br />              |
| H3    | Chapter title         | 44px | Bold    | <br />              |
| H4    | Card title            | 22px | Bold    | <br />              |
| P     | Body content          | 17px | Regular | <br />              |
| High  | Emphasized data       | 32px | Bold    | <br />              |
| Sub   | Notes/sources         | 13px | Regular | <br />              |
| XS    | Page number/copyright | 11px | Regular | <br />              |

***

## V. Core Visual Elements

### 1. Rectangular Header Bars

The template uses clean rectangular color blocks for a professional appearance:

```
Cover: Large deep-blue rectangular block on the left side (approx. 35% of width)
Chapter page: Full-screen deep blue + rectangular content area
Content page: Straight rectangular blue accent strip at the top (80-90px height) + rectangular light accent strip below
```

### 2. Wave Patterns (Flowing Elements)

Abstract curves symbolizing healthcare and innovation:

```xml
<path d="M0,700 Q320,680 640,700 T1280,680 L1280,720 L0,720 Z"
      fill="#006BB7" fill-opacity="0.08"/>
```

### 3. Light Dot Decorations (City Lights)

Small circle elements representing the nighttime lights of the Mountain City:

```xml
<circle cx="x" cy="y" r="3" fill="#D4A84B" fill-opacity="0.6"/>
```

***

## VI. Page Types

### 1. Cover Page (01\_cover.svg)

**Layout Structure**:

- Upper-right area: Logo (using logo.png)
- Center-left: Main title + subtitle
- Lower-left corner: Large diagonal deep-blue color block (extending from lower-left to upper-right)
- Bottom: Presenter info, date
- Decorations: Wave patterns + gold light dots

### 2. Chapter Page (02\_chapter.svg)

**Layout Structure**:

- Full-screen deep blue background
- Upper-right: Diagonal light area (sky blue gradient)
- Left: Large chapter number (semi-transparent)
- Center-left: Chapter title (white)
- Bottom: Gold decorative line + Logo (white version)

### 3. Content Page (03\_content.svg)

**Layout Structure**:

- Top: Straight rectangular blue accent strip (approx. 80px height)
- Below accent strip: Straight rectangular light accent strip (15px height)
- On the accent strip: Page title + Logo
- Body: White content area (flexible layout)
- Left: Thin gold decorative line
- Bottom: Clean footer + wave pattern

### 4. Ending Page (04\_ending.svg)

**Layout Structure**:

- Center: Large-sized Logo
- Below logo: Thank-you message
- Bottom diagonal blue area: Contact information
- Decorations: Wave patterns + gold light dots

### 5. Table of Contents (02\_toc.svg)

**Layout Structure**:

- Top rectangular accent strip + title
- Below accent strip: Straight rectangular light accent strip (15px height)
- Left: Large numeric indices (vertically arranged, with gold accents)
- Right: TOC item text
- Bottom: Wave decoration

***

## VII. Logo Usage Guidelines

| File            | Applicable Context      | Notes         |
| --------------- | ----------------------- | ------------- |
| `卫宁健康logo.png`  | Light/white backgrounds | Blue version  |
| `卫宁健康logo2.png` | Dark/blue backgrounds   | White version |

**Recommended Logo Sizes**:

- Cover page: Width 280-320px
- Content page header: Width 160-200px
- Ending page: Width 200-220px

***

## VIII. Spacing Specification

| Element                   | Value   |
| ------------------------- | ------- |
| Page margins              | 60px    |
| Content block spacing     | 28px    |
| Card inner padding        | 24px    |
| Card border radius        | 12px    |
| Header bar height         | 80-90px |
| Light accent strip height | 15px    |

***

## IX. SVG Technical Constraints

### Mandatory Rules

1. viewBox: `0 0 1280 720`
2. Define gradients using `<linearGradient>` inside `<defs>`
3. Use `fill-opacity` / `stroke-opacity` for transparency
4. Use `<tspan>` for text wrapping
5. Use Base64 inline or `<image>` reference for logos

### Prohibited Elements

- `mask`, `<style>`, `class`; `clipPath` is allowed only on `<image>` under `shared-standards.md` §1.2
- `foreignObject`, `textPath`, `animate*`
- `rgba()` color format
- `<g opacity="...">` (group opacity)

***

## X. Placeholder Specification

| Placeholder            | Description          |
| ---------------------- | -------------------- |
| `{{TITLE}}`            | Main title           |
| `{{SUBTITLE}}`         | Subtitle             |
| `{{AUTHOR}}`           | Presenter name       |
| `{{ADVISOR}}`          | Thesis advisor       |
| `{{INSTITUTION}}`      | College/Institution  |
| `{{DATE}}`             | Date                 |
| `{{PAGE_TITLE}}`       | Page title           |
| `{{CHAPTER_NUM}}`      | Chapter number       |
| `{{CHAPTER_TITLE}}`    | Chapter title        |
| `{{CHAPTER_DESC}}`     | Chapter description  |
| `{{KEY_MESSAGE}}`      | Key message          |
| `{{CONTENT_AREA}}`     | Content area         |
| `{{PAGE_NUM}}`         | Page number          |
| `{{THANK_YOU}}`        | Thank-you message    |
| `{{CONTACT_INFO}}`     | Contact information  |
| `{{TOC_ITEM_N_TITLE}}` | TOC item title       |
| `{{TOC_ITEM_N_DESC}}`  | TOC item description |

