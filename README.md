# dsh-preview-snip

Snip, annotate or quote **any** document preview in DSH and put the result into the composer.

![Quick snip and composer attachment](https://raw.githubusercontent.com/439436269-ctrl/dsh-preview-snip/main/docs/snip.png)

![Annotation editor](https://raw.githubusercontent.com/439436269-ctrl/dsh-preview-snip/main/docs/snip-editor.png)

## What it does

The plugin adds three actions to the right-Sidebar document-preview header:

- **圈选 / Snip** — drag a rectangle; the selection becomes a PNG attachment in the composer. The quick path only adds the image; it does not fill in a question.
- **全能圈选 / Annotate** — drag a rectangle, then open an editor and add a **box**, **circle/ellipse**, **arrow** or **text**, choose a color, undo/clear, and insert the annotated PNG.
- **引用选中 / Quote selection** — quote the current text selection into the composer as a Markdown blockquote.

Nothing is sent automatically: the attachment and text land in the composer, and you finish the question and press send.

## Works on every preview type

- **Pixels:** `<img>`, `<video>` current frame and `<canvas>` — images, PDF pages, video frames and WebGL viewports (the first-party Blender/STL viewers keep their drawing buffer).
- **DOM screenshot:** text, Markdown, code and HTML previews are serialized to an SVG `foreignObject` and rasterized in the browser; the current pane stylesheet is embedded, so the screenshot keeps the preview's appearance.
- **Quote:** any preview whose text is selectable.

## Annotation editor

After a full snip you get a canvas editor:

- box, ellipse, arrow, text;
- red / amber / blue / green;
- undo, clear, cancel, insert;
- text is entered inline (not a browser prompt);
- the inserted image is the annotated canvas, not the original crop.

## Install

```sh
dsh plugin --profile <profile> add dsh-preview-snip
```

Open any file in the right Sidebar. The three buttons appear as one segmented group in the preview header.

## How it works

- Uses the `sidebar.right.tab.document.actions` slot; no Host routes and no external screenshot library.
- Pixel crops map through `object-fit: contain` for images/video, and use the canvas bitmap for PDF/WebGL.
- DOM previews are cloned, the pane's CSS rules are embedded, and the clone is drawn through an SVG `foreignObject`.
- Creates the PNG in the browser and hands it to `conversation.createDrafts` / `inputActions.addAttachments`, the same draft attachment path as a pasted image.
- Quoting uses the browser text selection and `inputActions.setDraft`.

## Limits

- DOM screenshots skip cross-origin stylesheets and cross-origin background images; text and layout still render.
- Video captures the current frame; it does not record.
- WebGL capture needs the viewer to keep its drawing buffer; the first-party Blender and STL viewers do. A third-party WebGL preview that clears its buffer may capture blank.
- Cross-origin images that taint the canvas fail with a notice.
- The editor is client-side only; the original file is never modified.

## Compatibility

- DSH `0.2.0-rc.2` (and `0.2.1-rc.2`).
- Client-only plugin; no Host configuration.
