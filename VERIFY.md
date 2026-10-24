# Verification record — dsh-preview-snip 0.2.0

## Unit tests

`node --test test/*.test.js` → **1 pass, 0 fail**.

The bundle registers exactly one `sidebar.right.tab.document.actions` entry with id `preview-snip` and a session inject factory.

## Image quick snip (preview-test, 2026-10-24)

Opened a 695×390 image, clicked `圈选`, dragged a rectangle:

- notice `已把圈选图片插入输入框`;
- composer text `请解释圈选区域的内容。`;
- attachment `preview-snip-*.png` in the composer rail;
- no page errors.

## Image full snip + annotation (preview-test, 2026-10-24)

Clicked `全能圈选`, dragged a region, then in the editor:

- drew a box, an ellipse and an arrow;
- switched to `文字`, clicked the canvas, typed `重点` in the inline input and pressed Enter;
- `data-snip-shapes` reached **4** (box + ellipse + arrow + text);
- clicked `插入输入框`: editor closed, notice shown, attachment `preview-snip-*.png` present, composer text set;
- no page errors; editor screenshot at `docs/snip-editor.png`.

## DOM preview quick snip (preview-test, 2026-10-24)

Opened `D:\codes\MEMORY.md` (Markdown text preview), clicked `圈选`, dragged over the text pane:

- notice `已把圈选图片插入输入框`;
- attachment `preview-snip-*.png` present;
- no page errors;
- this exercises the DOM-to-SVG `foreignObject` path.

## Not yet verified after this release

- Desktop profile restart (package installed, app process still predates the change).
- A live video frame and a WebGL viewport; both use the same canvas crop path, and the first-party 3D viewers already set `preserveDrawingBuffer: true`.
