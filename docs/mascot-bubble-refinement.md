# Mascot Bubble Refinement

## Overview

The mascot hover interaction now uses one dimensional bubble around the mascot.
It keeps the page's mint, cream, and soft clay visual language while giving the
shield gesture a clearer sense of protection and response.

## Interaction details

- The bubble eases in, settles with a short organic wobble, and releases smoothly.
- A curved perimeter catchlight travels around the bubble during entry.
- Pointer movement shifts the bubble lighting and rim perspective.
- The shield receives a narrow cream gleam instead of a second circular glow.
- The mascot continues its ambient blink cycle while hovering, including a blink
  after the bubble settles.
- Touch, keyboard focus, and reduced-motion behavior remain supported.

## Design intent

The interaction is deliberately built around a single visual container so the
feedback feels like a protective field rather than multiple competing rings.
Transparency, soft shadows, and cream highlights keep the effect connected to
the existing Sane mascot and theme in both light and dark modes.

## Verification

- 657 application tests passed.
- 18 tooling tests passed.
- Formatting, lint, typecheck, and production build passed.
- Desktop and phone previews were checked in both themes.
- Hover blinking was verified while the bubble was held active.
- No horizontal overflow or browser console errors were observed.
