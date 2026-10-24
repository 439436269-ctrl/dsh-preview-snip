# Changelog

## 0.2.1 — 2026-10-24

- Quick/full snip now attaches **only the image**; the default "请解释圈选区域的内容。" text is no longer inserted into the composer.
- **按钮组合**: quick / annotate / quote are now one segmented group with `white-space: nowrap`, so narrow preview headers keep them horizontal instead of one character per line.
- **Hot-reload CSS fix**: the injected stylesheet is replaced on every load instead of skipped when the old 0.1.x `<style>` element already exists. This is what made 全能圈选 show only a dark overlay/image without the editor toolbar in a hot-reloaded page.
- README/VERIFY updated for 0.2.1.

## 0.2.0 — 2026-10-24

- **All preview types**: the actions now appear on every document preview, not only images/PDF. Pixel capture covers images, video frames and canvas (PDF/WebGL); text/Markdown/code/HTML previews use a DOM-to-SVG `foreignObject` screenshot.
- **全能圈选 / Annotate**: after selecting a region, edit it before inserting — box, ellipse, arrow, text, four colors, undo, clear, cancel, insert.
- Inline text entry in the editor (no `window.prompt`).
- Quick **圈选** remains the one-drag path; **引用选中** is unchanged.

## 0.1.0

- Add 圈选 / Snip for image and PDF previews: drag a rectangle, crop it to PNG, attach it to the composer.
- Add 引用选中 / Quote selection: quote selected preview text into the composer.
- Uses the preview-header action slot and the conversation draft attachment API; no Host routes or screenshot dependency.
