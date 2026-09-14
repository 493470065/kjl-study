# Winning Health (卫宁健康) Template - Design Specification

> A distinctive design blending healthcare industry professionalism with modern corporate elegance.

***

## I. Template Overview

| Property               | Description                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Template Name**      | Winning Health (卫宁健康)                                                                            |
| **Use Cases**          | Corporate presentations, healthcare industry reports, strategic planning, business meetings      |
| **Design Tone**        | Professional · Warm · Trustworthy · Modern corporate style                                         |
| **Design Inspiration** | Healthcare warmth + corporate brand identity + modern business professionalism                   |

### Design Features

1. **Centered Layout**: Clean centered content layout providing a professional and structured appearance
2. **Red Accent**: Bold red color representing healthcare and vitality
3. **Gold Highlights**: Golden decorative elements for premium corporate feel
4. **Skyline Decoration**: Abstract city skyline patterns at the bottom

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

### Primary Colors (Red Theme)

| Role                 | Value     | Notes                                              |
| -------------------- | --------- | -------------------------------------------------- |
| **Winning Red**      | `#BD1B01` | Brand primary color; header, titles, main elements |
| **Deep Red**         | `#BD1B01` | Bottom bar, emphasis areas                         |
| **Warm Gold**        | `#D4A84B` | Decorative accents, highlights, subtitle text     |
| **Gold Light**       | `#C49A3D` | Gradient endpoint for gold elements                |
| **Background Cream** | `#FDF8F3` | Warm-tinted pure white                             |

### Text Colors

| Role               | Value     | Usage                     |
| ------------------ | --------- | ------------------------- |
| **Dark Ink Text**  | `#333333` | Main titles, heading text |
| **Primary Text**   | `#333333` | Body content, author info |
| **Secondary Text** | `#6B6B6B` | Captions, annotations     |
| **White Text**     | `#FFFFFF` | Text on dark backgrounds  |
| **Red Text**       | `#BD1B01` | Cover main title, emphasized text |
| **Gold Text**      | `#D4A84B` | Subtitles, decorative text |

### Gradient Scheme

```
Gold gradient: #C49A3D �?#D4A84B �?#C49A3D (decorative use)
Bottom bar gradient: #C90000 �?#DA4F3D (horizontal)
```

***

## IV. Typography System

### Font Stack

**Font Stack**: `"Microsoft YaHei", "微软雅黑", "PingFang SC", Arial, sans-serif`

### Font Size Hierarchy

| Level | Usage                 | Size | Weight  | Notes               |
| ----- | --------------------- | ---- | ------- | ------------------- |
| H1    | Cover main title      | 48px | Bold    | Grand and dignified |
| H2    | Page title            | 32px | Bold    |                     |
| H3    | Chapter title         | 44px | Bold    |                     |
| H4    | Card title            | 22px | Bold    |                     |
| P     | Body content          | 17px | Regular |                     |
| High  | Emphasized data       | 32px | Bold    |                     |
| Sub   | Notes/sources         | 13px | Regular |                     |
| XS    | Page number/copyright | 11px | Regular |                     |

***

## V. Core Visual Elements

### 1. Bottom Red Bar

The template uses a solid red bar at the bottom for visual anchor:

```
Height: 60px
Color: #BD1B01
Topped with: 3px gold accent line (#D4A84B)
```

### 2. Skyline Decoration

Abstract city skyline pattern at the bottom:

```xml
<path d="M0,560 Q160,540 320,560 T640,540 T960,560 T1280,540 L1280,660 L0,660 Z"
      fill="#D4A84B" fill-opacity="0.08"/>
```

### 3. Gold Accent Line

Horizontal gold line for visual separation:

```xml
<line x1="100" y1="600" x2="1180" y2="600" stroke="#D4A84B" stroke-width="1" stroke-opacity="0.3"/>
```

***

## VI. Page Types

### 1. Cover Page (01_cover.svg)

**Layout Structure**:

- Center: Main title (dark #1C1C1C, 54px)
- Below title: Subtitle (gold, 24px)
- Below subtitle: Presenter info (white, 18px) on gradient rounded rectangle background
- Lower area: Skyline pattern decoration
- Bottom: 80px gradient red bar (#C90000 �?#DA4F3D) + 3px gold accent line
- Bottom center: "WINNING HEALTH · YEAR" text

**Author Background Style**:
- Width: 280px, Height: 40px
- Corner radius: 20px (rounded rectangle)
- Gradient: #DA4F3D �?#DF8C63 (left to right)
- Text: White, centered, 18px Microsoft YaHei

### 2. Chapter Page (02_chapter.svg)

**Layout Structure**:

- Background: Cream white (`#FDF8F3`)
- Top: Red-gold-red gradient accent strip (8px height)
- Center: "CHAPTER" label (gold, 16px, uppercase)
- Center: Large chapter number (dark gray, 100px)
- Center: Chapter title (red, 48px)
- Center: Gold separator line (200px width)
- Center: Chapter description (gray, 18px)
- Bottom-right: Circular decorative pattern (red, semi-transparent)

### 3. Content Page (03_content.svg)

**Layout Structure**:

- Background: Cream white (`#FDF8F3`)
- Top: Red-gold-red gradient accent strip (8px height)
- Left: Gold vertical bar (6px width, 40px height)
- Left: Page title (dark gray #333333, 32px)
- Body: White content card (1160x440px, rounded corners)
- Bottom-right: Circular decorative pattern (red, semi-transparent)
- Bottom-left: Data source information (gray, 11px)
- Bottom-right: Page number (gray, 11px)

### 4. Ending Page (99_ending.svg)

**Layout Structure**:

- Center: "Thank you" message (dark gray, 56px)
- Below message: Ending subtitle (gold, 22px)
- Below subtitle: Company/contact info (dark gray, 18px)
- Lower area: Skyline pattern decoration
- Bottom: 60px red bar + 3px gold accent line

### 5. Table of Contents (02_toc.svg)

**Layout Structure**:

- Background: Cream white (`#FDF8F3`)
- Top: Red-gold-red gradient accent strip (8px height)
- Left: Gold vertical bar (6px width, 40px height) + "目录" title (red, 32px)
- Two-column layout:
  - Left column: 3 TOC items (01, 03, 05)
  - Right column: 3 TOC items (02, 04, 06)
- Each TOC item:
  - Large chapter number (light red, semi-transparent, 72px)
  - Gold vertical separator bar (4px width, 50px height)
  - Chapter title (dark gray, 20px, bold)
  - Chapter description (gray, 13px)
- Bottom-right: Circular decorative pattern (red, semi-transparent)

***

## VII. Logo Usage Guidelines

| File            | Applicable Context      | Notes         |
| --------------- | ----------------------- | ------------- |
| `卫宁健康logo.png`  | Light/white backgrounds | Red version |
| `卫宁健康logo2.png` | Dark/red backgrounds | White version |

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
| Bottom red bar height     | 80px    |

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
| `{{ENDING_SUBTITLE}}`  | Ending subtitle      |
| `{{CONTACT_INFO}}`     | Contact information  |
| `{{TOC_ITEM_N_TITLE}}` | TOC item title       |
| `{{TOC_ITEM_N_DESC}}`  | TOC item description |