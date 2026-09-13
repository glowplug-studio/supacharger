# Inline loading and SVG UI assets

Use `src/components/ui/loading-spinner.tsx` for every inline loading indicator unless a surface explicitly requires the black variant. The wrapper renders the primary `src/assets/svgr/ui/inline-loader.svg` through SVGR; the matching black variant is available at `src/assets/svgr/ui/inline-loader-dark.svg`. Both asset paths are developer-owned branding seams and must survive CLI installation and core updates. Customise either animation by replacing its SVG with another file of the same name; keep its `viewBox` so callers can size it with classes.

This contract is only for inline indicators such as pending buttons, form actions, uploads, and compact content states. Do not replace an application's route-level or full-page loading design with this asset unless that separate change is explicitly requested.

Render the shared wrapper rather than importing the SVG in each caller:

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

<LoadingSpinner className='size-5' label='Saving' />;
```

Both supplied assets expose their artwork colour through the root SVG `fill` attribute: the primary file defaults to white and the dark clone defaults to black. SVGR callers can override either colour with `fill`, and the shared wrapper passes its `fill` prop to the primary asset. A replacement is allowed to hard-code `fill` or `stroke`, so callers must not depend on an override taking effect after application customisation; the passed prop remains harmless when a replacement ignores it.

Store every UI SVG under the developer-owned `src/` path belonging to its feature or surface, with demo-only artwork under `src/components/sc_demo/`, and render it as an SVGR component. Keep an SVG in `public` only when metadata, a manifest, a third-party callback, or another URL-based contract requires it. Do not use `<img>`, `next/image`, CSS public URLs, or public path strings for component-owned SVG artwork unless that URL delivery is explicitly requested.

Responsive sources must keep a correct `viewBox` and omit root `width` and `height` when CSS controls sizing. Size the component at the call site with `size-*`, `w-*`, `h-*`, or `size-[1em]`; usually add `shrink-0` beside text and preserve the source aspect ratio. Use `currentColor` only when inheritance is intentional. Verify this source contract directly and inspect the rendered SVG at every affected viewport rather than hiding clipping with arbitrary dimensions.

When sourcing a replacement from [SVG Backgrounds animated SVG preloaders](https://www.svgbackgrounds.com/elements/animated-svg-preloaders/), verify and satisfy the asset's current licence and attribution terms before shipping it.

## Image loading placeholders

Use `src/assets/svgr/ui/image-loader.svg` through SVGR for pending images and thumbnails. Generated project images should use `src/components/sc_widgets/media/image-with-loader.tsx`. The wrapper reserves the container, places the loader behind the image, keeps the image fully hidden until `HTMLImageElement.decode()` completes, then fades in the complete image so progressive rows or partial pixels are never exposed. It resets when the source changes and handles cached images and failures. Disable the fade and pause the SVG animation for reduced-motion users, leaving static bars visible while pending. Keep buttons and form actions on the existing inline loader.

```tsx
import ImageLoader from '@/assets/svgr/ui/image-loader.svg';

// Within a relative image container with reserved dimensions:
{pending && (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <ImageLoader className="size-[50px] text-white/30" />
  </div>
)}
```

`pending` belongs to the image lifecycle: clear it on load and error, including a cached image that is already complete, and reset it whenever the source changes. For reduced motion, pause SVG animation using `pauseAnimations()` on the SVG element (SMIL is not stopped by Tailwind’s `motion-reduce:animate-none`).
