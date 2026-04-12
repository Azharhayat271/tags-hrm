# Design System — TAG Solutions HRM
### Stripe Design Language × TAG Solutions Brand Identity

---

## 1. Visual Theme & Atmosphere

The TAG Solutions HRM system carries the structural DNA of Stripe's design language — precision spacing, multi-layer shadows, the signature light-weight typographic authority — but replaces the cool blue-violet palette with TAG Solutions' warm white-and-orange brand identity.

Where Stripe leans into a twilight, financial-grade cool, this system leans warm and energetic. The page opens on a pure white canvas (`#ffffff`) with deep charcoal headings (`#1a1a1a`) and a signature orange (`#f97316`) that functions as both brand anchor and interactive accent. This isn't a generic amber or a faded coral — it's a vivid, saturated tech-orange that reads as driven, modern, and human. The overall impression is of a serious enterprise platform that hasn't forgotten it was built for people.

All Stripe structural rules are preserved: the `sohne-var` variable font with `"ss01"`, weight 300 as the headline signature, negative letter-spacing at display sizes, conservative 4–8px border radii, and the multi-layer shadow system. The only changes are color values — every blue-violet reference is replaced with orange, every navy with warm charcoal, every indigo dark section with TAG's deep orange-charcoal.

**Key Characteristics:**
- `sohne-var` with OpenType `"ss01"` on all text
- Weight 300 as the signature headline weight — light, confident
- Negative letter-spacing at display sizes (-1.4px at 56px, progressive relaxation downward)
- Warm multi-layer shadows using `rgba(120,53,15,0.15)` — elevation tinted with orange's shadow tone
- Deep charcoal (`#1a1a1a`) headings instead of black — warm and grounded
- Conservative border-radius (4px–8px) — nothing pill-shaped
- Amber (`#fbbf24`) as a secondary accent for gradients and decorative elements
- `SourceCodePro` as the monospace companion for code and technical labels

---

## 2. Color Palette & Roles

### Primary
| Token | Hex | Role |
|---|---|---|
| **TAG Orange** | `#f97316` | Primary brand color. CTA backgrounds, link text, interactive highlights. |
| **Deep Charcoal** | `#1a1a1a` | Primary heading color. Warm near-black, richer than pure `#000`. |
| **Pure White** | `#ffffff` | Page background, card surfaces, button text on dark backgrounds. |

### Brand & Dark
| Token | Hex | Role |
|---|---|---|
| **Brand Dark** | `#1c1917` | Deep warm-charcoal for dark sections, footer backgrounds, immersive brand moments. |
| **Dark Warm** | `#0c0a09` | The darkest neutral — almost-black with a warm undertone. |

### Accent Colors
| Token | Hex | Role |
|---|---|---|
| **Amber** | `#fbbf24` | Secondary accent for icons, gradients, and decorative highlights. |
| **Amber Light** | `#fef3c7` | Tinted surface for amber-themed cards and badges. |
| **Red-Orange** | `#ef4444` | Destructive actions, error states, alerts. |

### Interactive States
| Token | Hex | Role |
|---|---|---|
| **Primary Orange** | `#f97316` | Primary link, active state, selected element. |
| **Orange Hover** | `#ea6c0a` | Darker orange for hover on primary elements. |
| **Orange Deep** | `#c2530a` | Dark orange for icon hover states. |
| **Orange Light** | `#fed7aa` | Soft peach for subdued hover backgrounds. |
| **Orange Mid** | `#fb923c` | Range selector and input highlight color. |

### Neutral Scale
| Token | Hex | Role |
|---|---|---|
| **Heading** | `#1a1a1a` | Primary headings, nav text, strong labels. |
| **Label** | `#374151` | Form labels, secondary headings. |
| **Body** | `#6b7280` | Secondary text, descriptions, captions. |
| **Success Green** | `#16a34a` | Status badges, success indicators. |
| **Success Text** | `#15803d` | Success badge text. |
| **Warning Amber** | `#d97706` | Warning and highlight accent text. |

### Surface & Borders
| Token | Hex | Role |
|---|---|---|
| **Border Default** | `#f3ede8` | Standard border for cards, dividers, containers. Warm white-orange tint. |
| **Border Orange** | `#fed7aa` | Active/selected state borders on buttons and inputs. |
| **Border Soft Orange** | `#ffedd5` | Subtle orange-tinted borders for secondary elements. |
| **Border Amber** | `#fef3c7` | Amber-tinted borders for warm-themed elements. |
| **Border Dashed** | `#c2530a` | Dashed borders for drop zones and placeholder elements. |

### Shadow Colors
| Token | Value | Role |
|---|---|---|
| **Shadow Warm** | `rgba(120,53,15,0.15)` | Signature warm-tinted primary shadow. Brown-orange undertone echoes the brand. |
| **Shadow Deep** | `rgba(28,12,0,0.2)` | Deeper warm shadow for elevated elements. |
| **Shadow Black** | `rgba(0,0,0,0.08)` | Secondary shadow layer for depth reinforcement. |
| **Shadow Ambient** | `rgba(23,23,23,0.08)` | Soft ambient shadow for subtle elevation. |
| **Shadow Soft** | `rgba(23,23,23,0.06)` | Minimal ambient shadow for light lift. |

---

## 3. Typography Rules

### Font Family
- **Primary**: `sohne-var`, fallback: `SF Pro Display, -apple-system, sans-serif`
- **Monospace**: `SourceCodePro`, fallback: `SFMono-Regular, Menlo, monospace`
- **OpenType**: `"ss01"` enabled globally on all sohne-var text; `"tnum"` for tabular numbers on HR data (salaries, dates, hours).

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|
| Display Hero | 56px / 3.50rem | 300 | 1.03 | -1.4px | Maximum, whisper-weight authority |
| Display Large | 48px / 3.00rem | 300 | 1.15 | -0.96px | Secondary hero headlines |
| Section Heading | 32px / 2.00rem | 300 | 1.10 | -0.64px | Feature section titles |
| Sub-heading Large | 26px / 1.63rem | 300 | 1.12 | -0.26px | Card headings, sub-sections |
| Sub-heading | 22px / 1.38rem | 300 | 1.10 | -0.22px | Smaller section heads |
| Body Large | 18px / 1.13rem | 300 | 1.40 | normal | Feature descriptions, intro text |
| Body | 16px / 1.00rem | 300–400 | 1.40 | normal | Standard reading text |
| Button | 16px / 1.00rem | 400 | 1.00 | normal | Primary button text |
| Button Small | 14px / 0.88rem | 400 | 1.00 | normal | Secondary/compact buttons |
| Link | 14px / 0.88rem | 400 | 1.00 | normal | Navigation links |
| Caption | 13px / 0.81rem | 400 | normal | normal | Small labels, metadata |
| Caption Small | 12px / 0.75rem | 300–400 | 1.33–1.45 | normal | Fine print, timestamps |
| Caption Tabular | 12px / 0.75rem | 300–400 | 1.33 | -0.36px | HR data: salary, hours, dates |
| Micro | 10px / 0.63rem | 300 | 1.15 | 0.1px | Tiny labels, axis markers |
| Micro Tabular | 10px / 0.63rem | 300 | 1.15 | -0.3px | Chart data, small numbers |
| Code Body | 12px / 0.75rem | 500 | 2.00 | normal | Code blocks, syntax |
| Code Bold | 12px / 0.75rem | 700 | 2.00 | normal | Keywords, emphasis in code |

### Principles
- **Weight 300 as signature**: All headlines and body text use 300. Weight is reserved for 400 on buttons and navigation only. Never 600–700 in `sohne-var`.
- **`"ss01"` everywhere**: This is non-negotiable. It defines the letterform personality across every text element.
- **Progressive tracking**: -1.4px at 56px → -0.96px at 48px → -0.64px at 32px → -0.26px at 26px → normal at 16px and below.
- **`"tnum"` for HR data**: Any column of numbers — salary figures, leave balances, attendance hours, KPI scores — uses tabular numerals for alignment.

---

## 4. Component Styles

### Buttons

**Primary Orange**
```css
background: #f97316;
color: #ffffff;
padding: 8px 16px;
border-radius: 4px;
font: 16px sohne-var weight 400, "ss01";
border: none;

/* Hover */
background: #ea6c0a;
```
Use for: "Check In", "Apply Leave", "Download Slip", "Save"

**Ghost / Outlined**
```css
background: transparent;
color: #f97316;
padding: 8px 16px;
border-radius: 4px;
border: 1px solid #fed7aa;
font: 16px sohne-var weight 400, "ss01";

/* Hover */
background: rgba(249,115,22,0.05);
```
Use for: secondary actions, "Cancel", "View Details"

**Transparent Info**
```css
background: transparent;
color: #c2530a;
padding: 8px 16px;
border-radius: 4px;
border: 1px solid rgba(249,115,22,0.2);
```
Use for: tertiary/informational actions

**Neutral Ghost**
```css
background: transparent;
color: rgba(16,16,16,0.3);
padding: 8px 16px;
border-radius: 4px;
outline: 1px solid rgb(229,231,235);
```
Use for: disabled or muted actions

**Destructive**
```css
background: #ef4444;
color: #ffffff;
padding: 8px 16px;
border-radius: 4px;
```
Use for: delete, terminate, revoke access

---

### Cards & Containers
```css
background: #ffffff;
border: 1px solid #f3ede8;
border-radius: 6px; /* standard */

/* Elevated shadow */
box-shadow:
  rgba(120,53,15,0.15) 0px 30px 45px -30px,
  rgba(0,0,0,0.08) 0px 18px 36px -18px;

/* Hover: shadow deepens */
box-shadow:
  rgba(120,53,15,0.2) 0px 30px 45px -20px,
  rgba(0,0,0,0.1) 0px 18px 36px -18px;
```

---

### Badges & Status Tags

**Neutral Pill**
```css
background: #ffffff;
color: #1a1a1a;
padding: 0px 6px;
border-radius: 4px;
border: 1px solid #f3ede8;
font-size: 11px; weight 400;
```

**Success Badge** (Leave Approved, Active)
```css
background: rgba(22,163,74,0.15);
color: #15803d;
padding: 1px 6px;
border-radius: 4px;
border: 1px solid rgba(22,163,74,0.3);
font-size: 10px; weight 300;
```

**Warning Badge** (Pending Approval, On Leave)
```css
background: rgba(251,191,36,0.2);
color: #d97706;
padding: 1px 6px;
border-radius: 4px;
border: 1px solid rgba(251,191,36,0.4);
font-size: 10px; weight 300;
```

**Danger Badge** (Rejected, Exited, PIP)
```css
background: rgba(239,68,68,0.15);
color: #dc2626;
padding: 1px 6px;
border-radius: 4px;
border: 1px solid rgba(239,68,68,0.3);
font-size: 10px; weight 300;
```

**Orange Brand Badge** (Primary status, Super Admin)
```css
background: rgba(249,115,22,0.15);
color: #c2530a;
padding: 1px 6px;
border-radius: 4px;
border: 1px solid rgba(249,115,22,0.3);
font-size: 10px; weight 300;
```

---

### Inputs & Forms
```css
border: 1px solid #f3ede8;
border-radius: 4px;
font: 16px sohne-var weight 300, "ss01";
color: #1a1a1a;
background: #ffffff;

/* Placeholder */
color: #6b7280;

/* Label */
color: #374151; font-size: 14px; weight 400;

/* Focus */
border: 1px solid #f97316;
box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
outline: none;
```

---

### Navigation / Sidebar

**Top Navigation**
```css
background: #ffffff;
position: sticky; top: 0;
backdrop-filter: blur(12px);
border-bottom: 1px solid #f3ede8;

/* Links */
font: 14px sohne-var weight 400, "ss01";
color: #1a1a1a;

/* CTA button right-aligned */
background: #f97316; color: #ffffff;
border-radius: 4px; padding: 8px 16px;
```

**Sidebar**
```css
background: #fafaf9; /* warm off-white */
border-right: 1px solid #f3ede8;
width: 240px;

/* Nav item default */
color: #374151; font-size: 14px; weight 400;
border-radius: 6px; padding: 8px 12px;

/* Nav item active */
background: rgba(249,115,22,0.08);
color: #f97316;
border-left: 3px solid #f97316;

/* Nav item hover */
background: rgba(249,115,22,0.05);
color: #1a1a1a;
```

---

### Data Tables (Attendance, Leave, Payroll)
```css
/* Table container */
border: 1px solid #f3ede8;
border-radius: 6px;
overflow: hidden;

/* Header row */
background: #fafaf9;
color: #374151; font-size: 12px; weight 400;
text-transform: uppercase; letter-spacing: 0.05em;
font-feature-settings: "tnum";

/* Body row */
background: #ffffff;
color: #1a1a1a; font-size: 14px; weight 300;
border-bottom: 1px solid #f3ede8;
font-feature-settings: "tnum"; /* for all numeric columns */

/* Row hover */
background: #fef9f6;

/* Zebra stripe (optional) */
odd rows: background: #ffffff;
even rows: background: #fafaf9;
```

---

### Dark Brand Sections

Used for dashboard headers, onboarding banners, and featured module intros.

```css
background: #1c1917; /* warm charcoal, not pure black */
color: #ffffff;

/* Headline */
color: #ffffff; font: 32px sohne-var weight 300; letter-spacing: -0.64px; "ss01";

/* Body */
color: rgba(255,255,255,0.7); font-size: 16px; weight 300;

/* Inner cards */
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 6px;

/* Orange accent elements inside dark sections */
color: #fb923c; /* slightly lighter orange for dark bg legibility */
```

---

### Decorative Elements

**Dashed Borders**
```css
border: 1px dashed #c2530a;  /* orange — for drop zones, upload areas */
border: 1px dashed #fef3c7;  /* amber — for soft decorative outlines */
```

**Gradient Accents**
```css
/* Hero / banner decorative gradient */
background: linear-gradient(135deg, #f97316, #fbbf24);

/* Subtle warm surface gradient */
background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
```

---

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 2px, 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px
- Dense at the small end for data-heavy HRM views; generous spacing for chrome/navigation

### Grid & Container
- Max content width: 1200px
- Dashboard: sidebar (240px fixed) + main content (flex 1)
- Module pages: full-width data tables, 2-column summary cards above
- Full-width dark header sections for page titles and key actions
- Employee profile: 3-column at desktop (avatar/info | main data | actions)

### Section Rhythm
White content sections alternate with warm off-white (`#fafaf9`) backgrounds, creating a soft cadence. Dark charcoal sections (`#1c1917`) are reserved for the main dashboard header and major module heroes — used sparingly for maximum contrast impact.

### Border Radius Scale
| Size | Value | Use |
|---|---|---|
| Micro | 2px | Fine elements, tight tag corners |
| Standard | 4px | Buttons, inputs, badges — the workhorse |
| Comfortable | 5px | Standard cards |
| Relaxed | 6px | Nav items, sidebar containers, larger cards |
| Large | 8px | Featured cards, modal containers |
| Bottom-only | `0 0 6px 6px` | Tab panels, dropdown footers |

---

## 6. Depth & Elevation

| Level | Shadow | Use |
|---|---|---|
| Flat (0) | none | Page background, table rows |
| Ambient (1) | `rgba(23,23,23,0.06) 0px 3px 6px` | Sidebar, sticky nav |
| Standard (2) | `rgba(23,23,23,0.08) 0px 15px 35px` | Standard module cards |
| Elevated (3) | `rgba(120,53,15,0.15) 0px 30px 45px -30px, rgba(0,0,0,0.08) 0px 18px 36px -18px` | Featured cards, dropdowns |
| Deep (4) | `rgba(28,12,0,0.2) 0px 14px 21px -14px, rgba(0,0,0,0.08) 0px 8px 17px -8px` | Modals, date pickers |
| Focus Ring | `0 0 0 3px rgba(249,115,22,0.2)` + `1px solid #f97316` | Keyboard/click focus |

**Shadow philosophy**: The primary shadow color `rgba(120,53,15,0.15)` is a deep warm-brown that echoes the orange brand palette. It gives elevation a subtle warmth — the shadows don't feel gray or cold, they feel like afternoon light. Paired with the neutral `rgba(0,0,0,0.08)` secondary layer, it creates depth with character.

---

## 7. HRM-Specific Component Patterns

### Attendance Check-in Button
```css
/* Checked OUT state (prompt to check in) */
background: #f97316; color: #ffffff;
padding: 12px 24px; border-radius: 4px;
font-size: 16px; weight 400;
box-shadow: rgba(120,53,15,0.25) 0px 8px 20px -8px;

/* Checked IN state (prompt to check out) */
background: #1c1917; color: #ffffff;
border: 1px solid rgba(255,255,255,0.1);
```

### Leave Status Timeline
```css
/* Approved event dot */
background: #16a34a; width: 10px; height: 10px; border-radius: 50%;

/* Pending event dot */
background: #f97316; width: 10px; height: 10px; border-radius: 50%;

/* Rejected event dot */
background: #ef4444; width: 10px; height: 10px; border-radius: 50%;

/* Timeline line */
border-left: 2px solid #f3ede8;
```

### Salary Slip PDF Viewer Card
```css
background: #ffffff;
border: 1px solid #f3ede8;
border-radius: 8px;
box-shadow: rgba(120,53,15,0.15) 0px 30px 45px -30px,
            rgba(0,0,0,0.08) 0px 18px 36px -18px;

/* Download button */
background: #f97316; color: #ffffff;
padding: 8px 16px; border-radius: 4px;
```

### KPI Progress Bar
```css
/* Track */
background: #f3ede8; height: 6px; border-radius: 3px;

/* Fill */
background: linear-gradient(90deg, #f97316, #fbbf24);
border-radius: 3px;
transition: width 0.4s ease;
```

### Employee Lifecycle Event Cards
```css
/* Growth event (promotion, increment) */
border-left: 3px solid #16a34a;
background: rgba(22,163,74,0.04);

/* Administrative (transfer, role change) */
border-left: 3px solid #f97316;
background: rgba(249,115,22,0.04);

/* Warning / PIP */
border-left: 3px solid #d97706;
background: rgba(217,119,6,0.04);

/* Exit */
border-left: 3px solid #ef4444;
background: rgba(239,68,68,0.04);
```

---

## 8. Do's and Don'ts

### ✅ Do
- Use `sohne-var` with `"ss01"` on every text element — the stylistic set IS the brand
- Use weight 300 for all headlines and body text
- Apply warm-tinted shadows `rgba(120,53,15,0.15)` for elevated elements
- Use `#1a1a1a` (warm charcoal) for headings instead of `#000000`
- Keep border-radius between 4px–8px — conservative rounding is intentional
- Use `"tnum"` for all tabular HR data: salaries, leave days, hours worked
- Use `#f97316` orange as the sole primary interactive/CTA color
- Use `#1c1917` for dark brand sections — warm, not cold black
- Use `#fafaf9` as the sidebar and alternate-row background — warm off-white

### ❌ Don't
- Don't use weight 600–700 for `sohne-var` headlines — weight 300 is the brand voice
- Don't use large border-radius (12px+, pill shapes) on cards or buttons
- Don't use neutral gray shadows — always tint warm with `rgba(120,53,15,...)`
- Don't skip `"ss01"` on any `sohne-var` text
- Don't use pure black (`#000000`) for headings — always `#1a1a1a` warm charcoal
- Don't use blue or purple for any interactive elements — orange is primary
- Don't apply positive letter-spacing at display sizes
- Don't use amber/yellow for buttons or links — they're decorative and gradient only
- Don't use cool grays — every neutral in this system has a warm undertone

---

## 9. Quick Reference — Component Prompts

**Hero / Page Header (dark)**
> `#1c1917` background. Headline: 48px `sohne-var` weight 300, line-height 1.15, letter-spacing -0.96px, color `#ffffff`, `"ss01"`. Subtitle: 18px weight 300, `rgba(255,255,255,0.7)`. Orange CTA: `#f97316` bg, white text, 4px radius, 8px 16px padding. Ghost: transparent, `1px solid rgba(249,115,22,0.3)`, `#fb923c` text.

**Module Card (white)**
> `#ffffff` bg, `1px solid #f3ede8` border, 6px radius. Shadow: `rgba(120,53,15,0.15) 0px 30px 45px -30px, rgba(0,0,0,0.08) 0px 18px 36px -18px`. Title: 22px `sohne-var` weight 300, -0.22px tracking, `#1a1a1a`, `"ss01"`. Body: 16px weight 300, `#6b7280`.

**Data Table**
> Container: `1px solid #f3ede8`, 6px radius. Header: `#fafaf9` bg, `#374151` text, 12px uppercase, `"tnum"`. Row: `#ffffff` bg, 14px weight 300, `"tnum"` for numbers. Row hover: `#fef9f6`.

**Sidebar Navigation**
> `#fafaf9` bg, `1px solid #f3ede8` right border, 240px. Active item: `rgba(249,115,22,0.08)` bg, `#f97316` text, `3px solid #f97316` left border. Hover: `rgba(249,115,22,0.05)` bg.

**Success Badge**
> `rgba(22,163,74,0.15)` bg, `#15803d` text, `1px solid rgba(22,163,74,0.3)` border, 4px radius, 1px 6px padding, 10px `sohne-var` weight 300.

**Warning / Pending Badge**
> `rgba(249,115,22,0.15)` bg, `#c2530a` text, `1px solid rgba(249,115,22,0.3)` border, 4px radius, 10px weight 300.

---

## 10. CSS Variables — Full Token Sheet

```css
:root {
  /* Brand */
  --tag-orange: #f97316;
  --tag-orange-hover: #ea6c0a;
  --tag-orange-deep: #c2530a;
  --tag-orange-light: #fed7aa;
  --tag-orange-pale: #fff7ed;
  --tag-orange-mid: #fb923c;

  /* Amber accent (decorative only) */
  --tag-amber: #fbbf24;
  --tag-amber-light: #fef3c7;

  /* Headings & Text */
  --tag-heading: #1a1a1a;
  --tag-label: #374151;
  --tag-body: #6b7280;

  /* Backgrounds */
  --tag-bg: #ffffff;
  --tag-bg-warm: #fafaf9;
  --tag-bg-orange-tint: #fef9f6;

  /* Dark sections */
  --tag-dark: #1c1917;
  --tag-darkest: #0c0a09;

  /* Borders */
  --tag-border: #f3ede8;
  --tag-border-orange: #fed7aa;
  --tag-border-soft: #ffedd5;
  --tag-border-dashed: #c2530a;

  /* Shadows */
  --tag-shadow-warm: rgba(120,53,15,0.15);
  --tag-shadow-deep: rgba(28,12,0,0.2);
  --tag-shadow-black: rgba(0,0,0,0.08);
  --tag-shadow-ambient: rgba(23,23,23,0.08);

  /* Elevation presets */
  --tag-shadow-standard:
    rgba(120,53,15,0.15) 0px 30px 45px -30px,
    rgba(0,0,0,0.08) 0px 18px 36px -18px;
  --tag-shadow-elevated:
    rgba(120,53,15,0.2) 0px 30px 45px -20px,
    rgba(0,0,0,0.1) 0px 18px 36px -18px;
  --tag-shadow-modal:
    rgba(28,12,0,0.2) 0px 14px 21px -14px,
    rgba(0,0,0,0.08) 0px 8px 17px -8px;

  /* Status */
  --tag-success: #16a34a;
  --tag-success-bg: rgba(22,163,74,0.15);
  --tag-success-border: rgba(22,163,74,0.3);
  --tag-warning: #d97706;
  --tag-warning-bg: rgba(217,119,6,0.15);
  --tag-danger: #ef4444;
  --tag-danger-bg: rgba(239,68,68,0.15);

  /* Focus ring */
  --tag-focus-ring: 0 0 0 3px rgba(249,115,22,0.2);

  /* Typography */
  --tag-font: 'sohne-var', 'SF Pro Display', -apple-system, sans-serif;
  --tag-mono: 'SourceCodePro', 'SFMono-Regular', Menlo, monospace;

  /* Radius */
  --tag-radius-sm: 4px;
  --tag-radius-md: 6px;
  --tag-radius-lg: 8px;
}
```

---

## 11. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Mobile | <640px | Sidebar collapses to bottom tab bar, single column, reduced headings |
| Tablet | 640–1024px | Sidebar becomes icon-only (64px), 2-column cards |
| Desktop | 1024–1280px | Full 240px sidebar, 3-column dashboard cards |
| Large | >1280px | Centered content max 1200px with generous margins |

### Collapsing Strategy
- Hero: 56px → 32px on mobile, weight 300 maintained
- Sidebar: 240px full → 64px icon-only → bottom tab bar on mobile
- Cards: 3-col → 2-col → 1-col stacked
- Tables: horizontal scroll wrapper on mobile
- Dark sections: maintain full-width, reduce internal padding to 24px
- Typography scale compresses proportionally, letter-spacing preserved

---

*This design system is the Stripe design language with TAG Solutions' orange-and-white brand palette. Every structural rule from the Stripe system applies. Only the colors are TAG's.*