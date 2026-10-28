# Project-owned Supacharger widgets

`supacharger init` installs editable, composed widgets under `src/components/sc_widgets/`. They are starter implementations delivered by Core, but they belong to the application after installation. Core updates preserve the entire directory. The current updater does not add widget files introduced by a later Core release; those files require an explicit reviewed copy into the application.

Keep `src/components/ui/` for shadcn primitives and other low-level UI building blocks. Keep removable page and application demonstrations under `src/components/sc_demo/`. A composed Supacharger capability that developers are expected to restyle or adapt belongs under `sc_widgets`.

The supplied widget groups are:

- `auth/`: a button-triggered login/signup modal wrapping the complete managed authentication entry, including its typewriter heading. `LoginModal` accepts a trigger element, title, description, initial mode and return path. Its supplied media panel includes rounded artwork and attribution. It provides presentation only; enforce feature access on the server.

- `file-upload/`: controlled single or multi-file selection, validation, drag and drop, progress and existing-file presentation. It contains no Untitled UI source or assets.
- `image-upload/`: avatar and banner selection plus project-owned target, crop ratio, maximum input size and upload destination mapping.
- `media/`: crop maths, modal-based vertical banner positioning, pan and zoom repositioning, object URL lifecycle, authenticated image upload and decoded-image presentation.
- `profile/`: the editable account profile media preview and upload composition.
- `attribution/`, `error-page/` and `layout/`: other Supacharger-provided application presentation that developers may style while preserving any applicable licence requirements.

The public Core Widget Demos page uses local simulated uploads to expose progress bars, percentages and completion states without authentication or network writes. It also previews the project loading assets and the shared centred, fade-only modal. The UI section places a toast button alongside a signup/login modal button; the authentication modal uses the real configured sign-in flow. Banner repositioning opens automatically after image selection, is vertical-only and has no zoom control; avatar repositioning opens automatically and supports free dragging and zoom.

## Image policy boundary

`src/supacharger.adapters/media/image-targets.ts` is the authoritative, developer-owned server policy for every named image target. Each target defines its Storage bucket, default path prefix, filename prefix, input limits, pixel limit, output dimensions, resize fit, format, quality or compression, cache control, visibility and signed URL duration.

`src/components/sc_widgets/image-upload/project-image-policy.ts` is the matching project-owned presentation map. It defines the target selected by each widget, crop aspect ratio, shape, browser-side input limit, Storage bucket used for cleanup and optional relative upload destination. Keep both files aligned. The app server signs the selected policy, validated destination and crop. The browser uploads the file directly to the generic Edge processor, which verifies the permit and adds the authenticated user ID before storage.

Crop coordinates are an integer rectangle in oriented source pixels. Send them in the metadata request to `/api/images/authorise`; the signed permit carries them to `process-image-upload-v2`; no profile database column stores the crop. The returned object path is committed through the profile media RPC only after the image upload succeeds.

## Generated image loading

Render generated images through `media/image-with-loader.tsx`. Its reserved container displays the developer-owned `image-loader.svg` behind the image, waits for `HTMLImageElement.decode()`, then fades in the complete image. It resets when the source changes, handles cached images and failures, and pauses motion for reduced-motion users.
