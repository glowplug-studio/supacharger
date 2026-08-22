# Inline loading and SVG UI assets

Use `src/components/ui/loading-spinner.tsx` for every inline loading indicator unless a surface explicitly requires the black variant. The wrapper renders the primary `src/assets/images/ui/inline-loader.svg` through SVGR; the matching black variant is available at `src/assets/images/ui/inline-loader-dark.svg`. Both asset paths are developer-owned branding seams and must survive CLI installation and core updates. Customise either animation by replacing its SVG with another file of the same name; keep its `viewBox` so callers can size it with classes.

This contract is only for inline indicators such as pending buttons, form actions, uploads, and compact content states. Do not replace an application's route-level or full-page loading design with this asset unless that separate change is explicitly requested.

Render the shared wrapper rather than importing the SVG in each caller:

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

<LoadingSpinner className='size-5' label='Saving' />;
```

Both supplied assets expose their artwork colour through the root SVG `fill` attribute: the primary file defaults to white and the dark clone defaults to black. SVGR callers can override either colour with `fill`, and the shared wrapper passes its `fill` prop to the primary asset. A replacement is allowed to hard-code `fill` or `stroke`, so callers must not depend on an override taking effect after application customisation; the passed prop remains harmless when a replacement ignores it.

Store every SVG used as application UI under an appropriate `src/assets/` subdirectory and render it as an SVGR component. Keep an SVG in `public` only when metadata, a manifest, a third-party callback, or another URL-based contract requires it. Do not use `<img>`, `next/image`, CSS public URLs, or public path strings for component-owned SVG artwork unless that URL delivery is explicitly requested.

When sourcing a replacement from [SVG Backgrounds animated SVG preloaders](https://www.svgbackgrounds.com/elements/animated-svg-preloaders/), verify and satisfy the asset's current licence and attribution terms before shipping it.
