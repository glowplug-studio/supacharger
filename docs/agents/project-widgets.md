# Project-owned Supacharger widgets

`supacharger init` installs editable, composed widgets under `src/components/sc_widgets/`. They are starter implementations delivered by Core, but they belong to the application after installation. Core updates preserve the entire directory. The current updater does not add widget files introduced by a later Core release; those files require an explicit reviewed copy into the application.

Keep `src/components/ui/` for shadcn primitives and other low-level UI building blocks. Keep removable page and application demonstrations under `src/components/sc_demo/`. A composed Supacharger capability that developers are expected to restyle or adapt belongs under `sc_widgets`.

The supplied widget groups are:

- `file-upload/`: controlled single or multi-file selection, validation, drag and drop, progress and existing-file presentation. It contains no Untitled UI source or assets.
- `image-upload/`: avatar and banner selection plus project-owned target, crop ratio, maximum input size and upload destination mapping.
- `media/`: crop maths, modal-based vertical banner positioning, pan and zoom repositioning, object URL lifecycle, authenticated image upload and decoded-image presentation.
- `profile/`: the editable account profile media preview and upload composition.
- `attribution/`, `error-page/` and `layout/`: other Supacharger-provided application presentation that developers may style while preserving any applicable licence requirements.

The public Core Widget Demos page uses local simulated uploads to expose progress bars, percentages and completion states without authentication or network writes. It also previews the project loading assets and the shared centred, fade-only modal. Banner repositioning opens automatically after image selection, is vertical-only and has no zoom control; avatar repositioning opens automatically and supports free dragging and zoom.

## Image policy boundary

`supabase/functions/_shared/image-targets.ts` is the authoritative, developer-owned server policy for every named image target. Each target defines its Storage bucket, default path prefix, filename prefix, input limits, pixel limit, output dimensions, resize fit, format, quality or compression, cache control, visibility and signed URL duration.

`src/components/sc_widgets/image-upload/project-image-policy.ts` is the matching project-owned presentation map. It defines the target selected by each widget, crop aspect ratio, shape, browser-side input limit, Storage bucket used for cleanup and optional relative upload destination. Keep both files aligned. The Edge Function validates the selected target and destination, adds the authenticated user ID, performs the crop before resizing and never accepts caller-supplied compression settings or buckets.

Crop coordinates are an integer rectangle in oriented source pixels. Send them as JSON in the multipart `crop` field to `process-image-upload`; no profile database column stores the crop. The returned object path is committed through the profile media RPC only after the image upload succeeds.

## Generated image loading

Render generated images through `media/image-with-loader.tsx`. Its reserved container displays the developer-owned `image-loader.svg` behind the image, waits for `HTMLImageElement.decode()`, then fades in the complete image. It resets when the source changes, handles cached images and failures, and pauses motion for reduced-motion users.
