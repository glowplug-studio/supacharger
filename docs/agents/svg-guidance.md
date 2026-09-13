# UI SVGs and SVGR

- Store UI SVGs under an appropriate developer-owned `src/` path belonging to the feature or surface that owns them.
- Store demo-only SVGs under `src/components/sc_demo/` so removing the demo also removes its assets.
- Import UI SVGs as React components through SVGR. Use `public/` only when an asset genuinely needs a URL, such as metadata, a manifest, or an external integration contract.
- Keep every SVG responsive and preserve its aspect ratio. Every source SVG must have a valid `viewBox`.
- When CSS or Tailwind controls the rendered size, remove root-level intrinsic `width` and `height` attributes from the source SVG.
- Size SVG components at the call site with classes such as `size-*`, `w-*`, `h-*`, or `size-[1em]`. Usually add `shrink-0` when an SVG sits beside text.
- Do not force mismatched width and height values that distort the source aspect ratio. Do not fix clipping by adding arbitrary `width` or `height` props to the React component.
- Use `fill='currentColor'` or `stroke='currentColor'` only when the artwork is intended to inherit the surrounding text colour.
- Before changing an SVG component's sizing classes, inspect the rendered `<svg>` and confirm that SVGR/SVGO preserved its `viewBox`. For sizing such as `h-8 w-auto`, verify that the complete artwork stays inside the rendered bounds at every intended viewport size.
- Visually verify that responsive SVG assets retain their `viewBox`, omit root-level intrinsic dimensions, and render completely at every affected size.

A responsive source SVG root should look like:

```svg
<svg viewBox="0 0 323 46" ...>
```

Avoid root-level intrinsic dimensions when CSS controls sizing:

```svg
<svg width="323" height="46" viewBox="0 0 323 46" ...>
```
