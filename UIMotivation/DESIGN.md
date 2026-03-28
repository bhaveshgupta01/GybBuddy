# Design System: Early Morning Mist & Soft Wellness

## 1. Overview & Creative North Star: "The Ethereal Minimalist"
This design system rejects the "loud" and high-friction aesthetics of traditional fitness apps. Instead, it adopts the **Creative North Star of "The Ethereal Minimalist."** This is a philosophy of quiet authority, inspired by the precision of Japanese wellness brands and the airy, breathable layouts of high-end editorial magazines.

To move beyond the "template" look, we leverage **intentional asymmetry** and **tonal layering**. Elements should feel like they are floating in a soft morning fog, overlapping naturally rather than being trapped in a rigid grid. We prioritize "breathable" negative space over information density, ensuring every interaction feels like a moment of mindfulness rather than a chore.

---

## 2. Colors & Surface Philosophy
The palette is a sophisticated blend of cool "ice" tones and warm botanical accents. We move away from flat blocks of color in favor of shifting atmospheric gradients.

### The Palette
*   **Background (Ice-White):** `#F4F7F9` (Primary Canvas)
*   **Surface Tiers:**
    *   `surface_container_lowest`: `#FFFFFF` (Peak highlights)
    *   `surface_container_low`: `#EFF4F7` (Base sections)
    *   `surface_container_highest`: `#DBE4E8` (Deepest depth for nested elements)
*   **Accents (Signature Gradients):**
    *   **Primary (Sage):** `linear-gradient(135deg, #A8D5C2, #8BAF8E)` — Used for growth, completion, and positive action.
    *   **Secondary (Terracotta):** `linear-gradient(135deg, #D4917A, #C4785A)` — Used for energy, warmth, and high-priority metrics.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. A `surface-container-low` card sitting on a `surface` background provides all the definition needed. Lines create visual noise; tonal shifts create atmosphere.

### The Glass & Gradient Rule
To achieve a premium "Signature" feel:
*   **Floating Elements:** Use `surface_container_lowest` at 55% opacity with a `backdrop-filter: blur(20px)`.
*   **CTAs:** Never use a flat color for primary buttons. Use the Sage or Terracotta gradients to provide "soul" and a sense of light source.

---

## 3. Typography: Editorial Precision
The typography system uses a condensed, clean aesthetic with tight tracking to mimic high-end print design. 

*   **Font Family:** `Manrope` (Condensed feel).
*   **The Slate Contrast:** Use `on_surface` (`#2C3E4A`) for all text.
*   **Letter Spacing:** All headlines and titles must use a tight tracking of `-0.03em` to `-0.05em`. This gives the text a "locked-in," professional editorial look.
*   **Hierarchy:** 
    *   **Display (L/M/S):** Light (300) weight. Use for big "Morning Greeting" or "Daily Summary" numbers.
    *   **Headline & Title:** Medium (400) weight. Condensed tracking is vital here to maintain the "Soft Wellness" vibe.
    *   **Body:** Regular (400) weight for legibility. Keep line heights generous (1.5x+) to allow the text to breathe.

---

## 4. Elevation & Depth: Tonal Layering
We do not use Material-style drop shadows. Depth is achieved through **The Layering Principle**.

*   **Ambient Shadows:** If a card must float, use a shadow with a blur of `24px-40px` and an opacity of `4%-6%`. The shadow color must be a tint of `on_surface` (Slate), never pure black.
*   **The "Ghost Border" Fallback:** If a container lacks contrast against its background, use a 1px border with `outline_variant` at **15% opacity**. It should be felt, not seen.
*   **Nesting:** Treat the UI as stacked sheets of frosted glass.
    *   *Level 0:* `background` (#F7FAF6)
    *   *Level 1:* `surface_container_low` (Section area)
    *   *Level 2:* `surface_container_lowest` (Interactive card)

---

## 5. Components & Primitives

### Buttons
*   **Primary:** Uses the Sage linear gradient. 48px height, `lg` (2rem) corner radius. No shadow; instead, use a 2px inner glow (white at 20% opacity) on the top edge.
*   **Secondary:** `surface_container_highest` background with Slate text.
*   **Tertiary:** Ghost style; text-only with a `-0.05em` letter-spacing.

### The "Mist" Card (Signature Component)
*   **Style:** `backdrop-filter: blur(20px)`, 55% white opacity.
*   **Radius:** `md` (1.5rem / 24px) is the standard for all cards.
*   **Content:** No dividers. Use `spacing-6` (2rem) to separate internal headers from body text.

### Inputs & Fields
*   **Form Factor:** Soft-filled backgrounds (`surface_container_high`) rather than outlined boxes.
*   **Active State:** The border transitions from transparent to a soft Sage (`primary`) glow.

### Wellness-Specific Components
*   **The Breathe Tracker:** A circular progress element using the Sky Blue to Mint gradient, utilizing a soft pulse animation.
*   **Activity Chips:** Non-clickable chips used for "Morning," "Evening," etc., using `surface_container_lowest` and `label-sm` typography.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. For example, a headline might have a `spacing-8` left margin and a `spacing-12` right margin to create an editorial feel.
*   **Do** allow images of nature or soft light to bleed behind Glassmorphism cards.
*   **Do** use the `24px` (md) border radius consistently to maintain the "Soft" brand promise.

### Don’t:
*   **Don’t** use pure black (#000000) for anything. The darkest color should be the Slate `#2C3E4A`.
*   **Don’t** use sharp 90-degree corners. Even small elements like checkboxes must have a `sm` (0.5rem) radius.
*   **Don’t** use dividers or "HR" lines. Use the Spacing Scale (specifically `spacing-8` or `spacing-10`) to create distinction between content blocks.
*   **Don’t** design a Dark Mode. This system is fundamentally rooted in "Early Morning Light"; dark mode violates the core brand atmospheric.