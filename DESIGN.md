---
name: crumbz
description: Dónde comer en Caracas, dicho por gente que fue. Nada se afirma sin prueba.
colors:
  background: '#FAFAF9'
  surface: '#F0EFED'
  surface-raised: '#FFFFFF'
  line: '#E7E5E4'
  pressed: 'rgba(28, 25, 23, 0.08)'
  scrim: 'rgba(28, 25, 23, 0.48)'
  text: '#1C1917'
  text-muted: '#6A625D'
  inverse: '#1C1917'
  text-on-inverse: '#FAFAF9'
  proof: '#1F7A4D'
  on-proof: '#FFFFFF'
  proof-subtle: '#E3F1E9'
  warning: '#A15C07'
  danger: '#B42318'
  photo-placeholder: '#D6D3D1'
  background-dark: '#141210'
  surface-dark: '#1F1C1A'
  surface-raised-dark: '#292524'
  line-dark: '#2E2A27'
  pressed-dark: 'rgba(245, 245, 244, 0.10)'
  scrim-dark: 'rgba(0, 0, 0, 0.64)'
  text-dark: '#F5F5F4'
  text-muted-dark: '#A8A29E'
  inverse-dark: '#F5F5F4'
  text-on-inverse-dark: '#1C1917'
  proof-dark: '#4CC38A'
  on-proof-dark: '#0B1F14'
  proof-subtle-dark: '#15301F'
  warning-dark: '#F0B44C'
  danger-dark: '#F97066'
  photo-placeholder-dark: '#44403C'
typography:
  display:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '52px'
    fontWeight: 800
    lineHeight: '52px'
    letterSpacing: '-2px'
    fontFeature: 'tnum'
  headline:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '32px'
    fontWeight: 800
    lineHeight: '36px'
    letterSpacing: '-1px'
  title:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '20px'
    fontWeight: 800
    lineHeight: '26px'
    letterSpacing: '-0.3px'
  body:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 500
    lineHeight: '22px'
    letterSpacing: '0px'
  body-strong:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 800
    lineHeight: '22px'
    letterSpacing: '0px'
  body-small:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 500
    lineHeight: '20px'
    letterSpacing: '0px'
  label:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 500
    lineHeight: '16px'
    letterSpacing: '0.1px'
  label-strong:
    fontFamily: 'Manrope, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 800
    lineHeight: '16px'
    letterSpacing: '0.1px'
rounded:
  sm: '6px'
  md: '12px'
  lg: '16px'
  pill: '999px'
spacing:
  xxs: '2px'
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  xxl: '32px'
  xxxl: '48px'
components:
  button-proof:
    backgroundColor: '{colors.proof}'
    textColor: '{colors.on-proof}'
    typography: '{typography.body}'
    rounded: '{rounded.pill}'
    padding: '0 12px'
    height: '48px'
  button-inverse:
    backgroundColor: '{colors.inverse}'
    textColor: '{colors.text-on-inverse}'
    typography: '{typography.body}'
    rounded: '{rounded.pill}'
    padding: '0 12px'
    height: '48px'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.text}'
    typography: '{typography.body}'
    rounded: '{rounded.pill}'
    padding: '0 12px'
    height: '48px'
  icon-button:
    backgroundColor: 'transparent'
    textColor: '{colors.text}'
    rounded: '{rounded.pill}'
    size: '48px'
  icon-button-pressed:
    backgroundColor: '{colors.pressed}'
  score-claim:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    typography: '{typography.display}'
    rounded: '{rounded.lg}'
    padding: '16px'
  proof-pair:
    backgroundColor: 'transparent'
    textColor: '{colors.text}'
    typography: '{typography.body-strong}'
    padding: '12px 0'
    height: '48px'
  proof-pair-pressed:
    backgroundColor: '{colors.pressed}'
  photo-plate:
    backgroundColor: '{colors.photo-placeholder}'
    rounded: '{rounded.md}'
---

# Design System: crumbz

## Overview

**Creative North Star: "Dicho y probado"**

crumbz is a ledger of evidence dressed as a quiet stone page. Every claim the screen makes (a score, a price range, a generator, a payment method) sits beside the count of real visits that back it, and the only colour on the page is the colour of that proof. Everything else is a fine warm-neutral scale: stone paper, near-black ink, hairline 1px rules. The world rejects the category's default kit of star ratings, chips and carousels; trust is shown by arithmetic, not decoration.

Density is calm and list-like. A screen reads top to bottom as a column of facts separated by hairlines, with one tonal panel reserved for the score and a row of fixed 4:5 photo plates so visits compare side by side. Type does the hierarchy with only two weights of Manrope, 800 for what is asserted and counted, 500 for everything that describes it. Numbers are always tabular so proof counts line up in a column.

The same identity ships on Android and iPhone. Structure follows Material 3 and the brand lives in the theming. The OS supplies its own back and share glyphs, and iOS keeps its system guarantees (safe area, edge-swipe back, Reduce Motion, 44pt targets, covered by the 48 target). Light and dark are both first-class and follow the system appearance.

**Key Characteristics:**

- One accent, green, spent only on proof counts, confirmations and the WhatsApp action.
- Claim on the left, proof on the right, in tabular figures, on every fact.
- Two weights (500 / 800), one family (Manrope).
- Flat surfaces, 1px lines, no shadows, no cards.
- Fixed 4:5 photo plates for user photos.
- 48px minimum touch target everywhere.

## Colors

A warm stone neutral scale carrying all structure, with a single green that means "people confirmed this".

### Primary

- **Proof Green** (`proof`; dark `proof-dark`): the colour of evidence. Used for proof counts ("47 personas reales", "confirmado en 12 visitas"), confirmations, and the filled WhatsApp button. Nothing else earns it. `on-proof` is the ink on a green fill; `proof-subtle` is a pale green tint available for proof-backed highlights.

### Neutral

- **Stone Paper** (`background`): the page in light mode; Charred Stone (`background-dark`) in dark.
- **Warm Ash** (`surface`): the single tonal panel (the score block). Not a card fill for lists.
- **Bare White** (`surface-raised`): raised surfaces: text inputs and dialogs. Not used on the anchor screen.
- **Hairline Stone** (`line`): 1px dividers between facts, top rule of the action bar, distribution-bar tracks.
- **Ink Stone** (`text`): primary text, the score digits, distribution fills, outline-button stroke.
- **Muted Stone** (`text-muted`): meta lines, details under claims, distribution labels, "sin datos aún". Contrast-checked at 4.5:1 or more on background and surface in both schemes.
- **Inverse Ink** (`inverse` / `text-on-inverse`): the neutral filled button.
- **Plate Stone** (`photo-placeholder`): the fill of a photo plate before its image loads.
- **Press Veil** (`pressed`): translucent overlay for pressed and ripple feedback on tappable rows and icon buttons.
- **Scrim** (`scrim`): dimmed backdrop behind in-app dialogs (`ConfirmDialog`). Dialogs are drawn by the app, not the OS, so confirmations keep crumbz ink instead of the platform accent.

### Status

- **Place-Says Amber** (`warning`): one meaning only, "solo lo dice el lugar", a claim made by the place with no visit to back it.
- **Danger Red** (`danger`): destructive and error states.

### Named Rules

**The Proof Is the Only Colour Rule.** Green appears only on proof counts, confirmations and the WhatsApp action. If something is not evidence or that action, it stays stone. That includes active states, links and decoration.

**The Amber Means Unverified Rule.** `warning` is not a general alert colour. It marks a claim that only the place itself has made.

## Typography

**Display Font:** Manrope (with system-ui, sans-serif)
**Body Font:** Manrope
**Label Font:** Manrope

**Character:** A single geometric-humanist grotesk at two weights. 800 is heavy enough to make a claim feel stated, and 500 stays soft and readable for everything around it. Tight negative tracking on the large sizes; tabular figures wherever numbers appear.

### Hierarchy

- **Display** (800, 52/52, -2): the score figure only.
- **Headline** (800, 32/36, -1): the place name; the wordmark-style app name on the home screen.
- **Title** (800, 20/26, -0.3): section and empty-state titles.
- **Body** (500, 16/22): running text and button labels.
- **Body Strong** (800, 16/22): the claim in a proof pair.
- **Body Small** (500, 14/20): the meta line (categoría · zona · distancia), the rank line (#3 en Hamburguesas · Caracas), evidence rows. Bold within it only for the proof count in the score line.
- **Label** (500, 12/16, +0.1): details under claims, distribution labels and counts, evidence meta, and proof text that is not a confirmed count.
- **Label Strong** (800, 12/16, +0.1): confirmed proof counts.

Native sizes are sp and scale with the system font size. Native loads one family per weight (`Manrope_500Medium`, `Manrope_800ExtraBold`).

### Named Rules

**The Two Weights Rule.** 800 for what is asserted or counted: the name, the score, claims, proof counts. 500 for meta, the rank line and buttons. No third weight.

**The Tabular Figures Rule.** Any text that carries a number (score, prices, distances, counts, rank) uses tabular figures so values align in columns.

## Layout

A single column with 16px side margins and 16px between blocks, on a 4px scale (2 to 48). The anchor screen order: top app bar (back on the left, save and share on the right, 4px inset so 48px icon targets align with the margin), header block with 4px internal gaps, score panel, photo-plate row, the list of proof pairs, then a fixed bottom action bar.

The fact list is the rhythm of the system: each proof pair is at least 48px tall with 12px vertical padding and a 1px rule above every row except the first. The proof column sits on the right at up to 50% width, right-aligned, followed by an 18px chevron slot that is always reserved, so proof texts line up in one column whether or not a row can expand.

When the system font scale exceeds 1.15, the proof stacks under its claim (column layout, 4px gap) instead of sitting beside it. The bottom action bar holds two equal-width pill buttons with 8px between them, 12px top padding, and bottom padding of the safe-area inset or 12px, whichever is larger.

Motion is small and functional: rows expand in place with a 180ms linear layout transition, evidence fades in over 180ms, and the chevron rotates 180 degrees with an exponential ease-out.

### Named Rules

**The Reserved Slot Rule.** Every proof pair keeps its chevron slot, even when it cannot expand, so the proof column never jitters.

**The Stack Under Rule.** Above font scale 1.15 the proof goes under the claim; claims and proof are never truncated to keep them side by side.

## Elevation & Depth

The world is flat. There are no shadows anywhere. Depth comes from three things only: the tonal step from `background` to `surface` (the score panel), 1px `line` rules, and the translucent `pressed` veil for touch feedback. The bottom action bar separates from the scroll by a 1px top rule, not a shadow.

### Named Rules

**The Hairline Not Shadow Rule.** If two regions need separating, use a 1px rule or a tonal step. Never a shadow.

## Shapes

Soft, consistent corners. Photo plates use 12px, small evidence thumbnails and compact plates use 6px, and the score panel uses 16px. Every button and icon button is a full pill (999px). Distribution bars are 6px tall with 3px radii. Photo plates hold a fixed 4:5 ratio at every size (full row, 40px compact, 32px evidence thumbnail) so visits compare like specimens on a sheet.

## Components

### Buttons

Quiet pills; the colour tells you what kind of action it is.

- **Shape:** full pill (999px), minimum height 48px, 12px horizontal padding, 20px icon at stroke 2 with 8px gap before the label.
- **Proof:** green fill with `on-proof` ink. Reserved for the WhatsApp action; it is the only filled green button on any screen.
- **Inverse:** near-black fill with stone ink. The neutral primary action (for example, "Ver un perfil de ejemplo").
- **Outline:** transparent with a 1px `text` stroke and `text` ink. Secondary actions such as "Publicar visita".
- **Pressed / Disabled:** opacity 0.85 while pressed; 0.4 when disabled.
- **Label:** Body weight 500, single line.

### Icon Button

- **Shape:** 48px pill hit area, 22px Lucide icon at stroke 1.75 in `text`.
- **Pressed:** `pressed` veil fill.
- **Active (toggle):** the icon fills with `text`, as with the "quiero ir" bookmark. Active state stays ink, never green.
- **Accessibility:** an accessibility label is mandatory.
- **Platform glyphs:** iOS uses ChevronLeft for back and the iOS Share glyph; Android uses ArrowLeft and Share2.

### Score Claim

The score treated as a claim with its proof. A `surface` panel (16px radius, 16px padding, 12px gap) with the Display figure on the left (minimum 96px wide) and a three-bucket distribution on the right: label, 6px track in `line` with an ink fill proportional to the largest bucket, and a right-aligned count. Below it sits the proof line: the count of real people in bold green, then, in muted text, the rule that only each person's latest visit counts. It is announced to screen readers as one sentence.

### Proof Pair (signature)

The claim → proof pair is the system's signature move. Claim on the left in Body Strong with an optional muted Label detail; proof on the right in tabular figures. The wording depends on the basis: "promedio de N visitas" (averaged), "confirmado en N visitas" (confirmed) or "reportado en N visitas" (reported). State shows through form as well as colour:

- **Confirmed:** Label Strong in green. Tapping unfolds the evidence in place (32px 4:5 thumbnails, author · when, optional value), with an expanded state for assistive technology.
- **Unconfirmed:** plain Label in amber: "solo lo dice el lugar". Not tappable.
- **Unknown:** the claim drops to muted and the proof reads "sin datos aún" in muted Label. Not tappable.
  Rows are separated by 1px rules and use the `pressed` veil or ripple as touch feedback.

### Photo Plates

A row of equal-width 4:5 plates with 8px gaps and 12px radius, filled with `photo-placeholder` until the image loads. The compact variant is 40px wide with 6px radius and 4px gaps.

### Navigation

A minimal top app bar with no title and no fill: back on the left, page actions on the right, all as icon buttons. Persistent page actions live in the fixed bottom action bar, not in floating buttons.

## Do's and Don'ts

### Do:

- **Do** attach a proof to every claim about a place, worded by basis (promedio / confirmado / reportado) with the visit count in tabular figures.
- **Do** keep green for proof counts, confirmations and the WhatsApp button only.
- **Do** use amber only for "solo lo dice el lugar".
- **Do** use 800 for the name, the score, claims and proof counts, and 500 for meta, the rank line and buttons.
- **Do** separate list rows with 1px `line` rules and keep surfaces flat.
- **Do** hold user photos on fixed 4:5 plates.
- **Do** reserve the chevron slot on every proof pair and stack proof under the claim above font scale 1.15.
- **Do** keep every touch target at 48px or more and give icon-only buttons an accessibility label.
- **Do** use the OS back and share glyphs (iOS ChevronLeft/Share, Android ArrowLeft/Share2).

### Don't:

- **Don't** add shadows; depth is tonal steps and hairlines.
- **Don't** wrap facts in cards or chips; the score panel is the one tonal panel.
- **Don't** introduce a second accent colour, or use green for active states, links or decoration.
- **Don't** use star ratings or carousels to express quality; show the score with its count and distribution.
- **Don't** add a third font weight or a second family.
- **Don't** crop user photos to ratios other than 4:5.
