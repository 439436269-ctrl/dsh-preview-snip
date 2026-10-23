# Verification record — dsh-preview-snip 0.1.0

## Unit tests

`node --test test/*.test.js` → **1 pass, 0 fail**.

The bundle registers exactly one `sidebar.right.tab.document.actions` entry with id `preview-snip` and a session inject factory.

## Image preview e2e (2026-10-23, preview-test)

Opened `D:\codes\dsh-preview-market\docs\preview-market-section.png` in the right Sidebar (preview `<img>` 695×390), clicked `圈选`, dragged a 278×156 rectangle, and checked the composer:

- notice: `已把圈选图片插入输入框`;
- composer text: `请解释圈选区域的内容。`;
- attachment rail: `preview-snip-*.png` thumbnail (62×62);
- no page errors.

## PDF preview e2e (2026-10-23, preview-test)

Opened `D:\codes\resume-1.6\吕超杰-前端工程师-简历-v1.6.pdf` (rendered page canvas 695×983), clicked `圈选`, dragged over the canvas, and checked the composer:

- notice: `已把圈选图片插入输入框`;
- composer text: `请解释圈选区域的内容。`;
- attachment rail: `preview-snip-*.png`;
- no page errors.

## Text quote e2e (2026-10-23, preview-test)

Opened `D:\codes\dsh-preview-market\README.md`, selected `Preview market` in the text preview, clicked `引用选中`:

- notice: `已引用选中文字`;
- composer text: `> Preview market`;
- no page errors.

## Not yet verified

- Desktop profile after the pending restart (the plugin is installed there, but the app has not reloaded).
- 3D/WebGL and video-frame capture (intentionally out of scope for 0.1.0).
