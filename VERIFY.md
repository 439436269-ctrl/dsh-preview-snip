# Verification record — dsh-preview-snip 0.3.0

## Unit tests

`node --test test/*.test.js` → **1 pass, 0 fail**.

The bundle registers exactly one `sidebar.right.tab.document.actions` entry with id `preview-snip` and a session inject factory.

## Image quick snip (preview-test, 2026-10-24)

Opened a 695×390 image, clicked `圈选`, dragged a rectangle:

- notice `已把圈选图片插入输入框`;
- composer text remains **empty** (0.2.1 removed the default question);
- attachment `preview-snip-*.png` in the composer rail;
- no page errors.
- the three actions render as one horizontal segmented group (`data-snip-group`) in a narrow header.

## Image full snip + annotation (preview-test, 2026-10-24)

Clicked `全能圈选`, dragged a region, then in the editor:

- drew a box, an ellipse and an arrow;
- switched to `文字`, clicked the canvas, typed `重点` in the inline input and pressed Enter;
- `data-snip-shapes` reached **4** (box + ellipse + arrow + text);
- clicked `插入输入框`: editor closed, notice shown, attachment `preview-snip-*.png` present, composer text remains empty;
- no page errors; editor screenshot at `docs/snip-editor.png`.
- the injected stylesheet is replaced on load, so a hot-reloaded page gets the editor rules instead of the old 0.1.x sheet.

## DOM preview quick snip (preview-test, 2026-10-24)

Opened `D:\codes\MEMORY.md` (Markdown text preview), clicked `圈选`, dragged over the text pane:

- notice `已把圈选图片插入输入框`;
- attachment `preview-snip-*.png` present;
- no page errors;
- this exercises the DOM-to-SVG `foreignObject` path.

## Sidebar browser bridge (preview-test, 2026-10-24)

In a test host, opened an existing conversation (so `conversation.session.header.utilities` was mounted), injected a fake `<webview data-sidebar-browser-frame>` with a `capturePage()` returning a 600×400 PNG, then clicked the floating `圈选` and dragged over it:

- floating `圈选 / 全能圈选` group appeared over the fake webview;
- notice `已把圈选图片插入输入框`;
- attachment `preview-snip-*.png` present;
- composer text remained empty;
- no page errors.

This exercises the browser bridge and `captureBrowser` crop path. A real desktop `<webview>` is the same API; it was not available in the browser-based test host.

## Not yet verified after this release

- Desktop profile restart (package installed, app process still predates the change).
- A live video frame and a WebGL viewport; both use the same canvas crop path, and the first-party 3D viewers already set `preserveDrawingBuffer: true`.
