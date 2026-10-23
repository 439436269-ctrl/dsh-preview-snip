/**
 * dsh-preview-snip browser half.
 *
 * Adds two actions to the document-preview header:
 * - 圈选: drag a rectangle over an image or PDF canvas, crop it to PNG, and
 *   attach it to the composer.
 * - 引用选中: quote the current text selection into the composer.
 *
 * It uses the DSH document-preview action slot and the conversation draft
 * attachment API; no Host routes and no external screenshot library.
 */
window.__ModuleLoader__.load({
  id: "dsh-preview-snip",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");

    const NS = "previewSnip";
    const VISUAL = /\.(png|jpe?g|webp|gif|bmp|pdf)$/i;

    const zh = {
      snip: "圈选",
      quote: "引用选中",
      hint: "拖拽框选预览区域，Esc 取消",
      noVisual: "当前预览没有可截图的图像或画布",
      tooSmall: "圈选区域太小",
      noSelection: "先在预览里选中文字",
      added: "已把圈选图片插入输入框",
      quoted: "已引用选中文字",
      failed: "圈选失败",
      prompt: "请解释圈选区域的内容。"
    };

    const en = {
      snip: "Snip",
      quote: "Quote selection",
      hint: "Drag over the preview; Esc to cancel",
      noVisual: "This preview has no image or canvas to snip",
      tooSmall: "The selection is too small",
      noSelection: "Select some text in the preview first",
      added: "Snip added to the composer",
      quoted: "Selection quoted in the composer",
      failed: "Snip failed",
      prompt: "Please explain the selected region."
    };

    function installStyle() {
      if (typeof document === "undefined") return;
      if (document.getElementById("dsh-preview-snip.css") !== null) return;
      const style = document.createElement("style");
      style.id = "dsh-preview-snip.css";
      style.textContent = [
        "[data-preview-snip]{display:inline-flex;align-items:center;gap:4px}",
        "[data-preview-snip] button{appearance:none;border:0;border-radius:6px;padding:4px 8px;font:inherit;font-size:11.5px;line-height:1.2;cursor:pointer;color:inherit;background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}",
        "[data-preview-snip] button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.12))}",
        "[data-preview-snip] button:disabled{opacity:.45;cursor:default}",
        "[data-preview-snip] [data-snip-notice]{font-size:10.5px;opacity:.6;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
        "[data-preview-snip-overlay]{position:fixed;inset:0;z-index:99999;cursor:crosshair;background:rgba(15,17,21,.18);user-select:none;touch-action:none}",
        "[data-preview-snip-box]{position:fixed;border:2px solid #2c6ef2;background:rgba(44,110,242,.12);pointer-events:none;box-sizing:border-box}",
        "[data-preview-snip-hint]{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:100000;padding:6px 12px;border-radius:999px;font-size:12px;color:#fff;background:rgba(20,24,32,.82);pointer-events:none;white-space:nowrap}"
      ].join("\n");
      document.head.appendChild(style);
    }

    function rectBetween(a, b) {
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      return { x, y, w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
    }

    function intersection(a, b) {
      const x = Math.max(a.x, b.x);
      const y = Math.max(a.y, b.y);
      const right = Math.min(a.x + a.w, b.x + b.w);
      const bottom = Math.min(a.y + a.h, b.y + b.h);
      if (right <= x || bottom <= y) return null;
      return { x, y, w: right - x, h: bottom - y };
    }

    /** The displayed content box of an object-fit: contain image. */
    function containBox(rect, naturalWidth, naturalHeight) {
      if (!(naturalWidth > 0) || !(naturalHeight > 0)) return rect;
      const scale = Math.min(rect.w / naturalWidth, rect.h / naturalHeight);
      const w = naturalWidth * scale;
      const h = naturalHeight * scale;
      return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
    }

    /**
     * Pick the visible image/canvas under the selection. The preview lives on
     * the right side; avatars and icons are filtered out by size.
     */
    function findTarget(selection) {
      const rightSide = window.innerWidth * 0.45;
      let best = null;
      let bestArea = 0;
      for (const element of document.querySelectorAll("img,canvas")) {
        const box = element.getBoundingClientRect();
        const rect = { x: box.x, y: box.y, w: box.width, h: box.height };
        if (rect.w < 60 || rect.h < 60) continue;
        if (rect.x + rect.w < rightSide) continue;
        if (rect.y + rect.h < 0 || rect.y > window.innerHeight) continue;
        const hit = intersection(selection, rect);
        const area = hit === null ? 0 : hit.w * hit.h;
        if (area > bestArea) {
          best = element;
          bestArea = area;
        }
      }
      return best;
    }

    async function capture(selection) {
      const target = findTarget(selection);
      if (target === null) throw new Error("no-visual");
      const box = target.getBoundingClientRect();
      const rect = { x: box.x, y: box.y, w: box.width, h: box.height };
      let content = rect;
      let sourceWidth;
      let sourceHeight;
      if (target.tagName === "IMG") {
        sourceWidth = target.naturalWidth;
        sourceHeight = target.naturalHeight;
        if (!(sourceWidth > 0) || !(sourceHeight > 0)) throw new Error("natural-zero");
        content = containBox(rect, sourceWidth, sourceHeight);
      } else {
        sourceWidth = target.width;
        sourceHeight = target.height;
        if (!(sourceWidth > 0) || !(sourceHeight > 0)) throw new Error("no-visual");
      }
      const hit = intersection(selection, content);
      if (hit === null || hit.w < 4 || hit.h < 4) throw new Error("hit-empty");
      const sx = ((hit.x - content.x) / content.w) * sourceWidth;
      const sy = ((hit.y - content.y) / content.h) * sourceHeight;
      const sw = (hit.w / content.w) * sourceWidth;
      const sh = (hit.h / content.h) * sourceHeight;
      const outWidth = Math.max(1, Math.min(1600, Math.round(sw)));
      const outHeight = Math.max(1, Math.round((sh * outWidth) / sw));
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("canvas");
      context.drawImage(target, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => (value === null ? reject(new Error("encode")) : resolve(value)), "image/png");
      });
      return new File([blob], `preview-snip-${Date.now()}.png`, { type: "image/png" });
    }

    function SnipAction({ absolutePath, inputActions, useInput, createDrafts, t }) {
      const [active, setActive] = React.useState(false);
      const [box, setBox] = React.useState(null);
      const [notice, setNotice] = React.useState("");
      const start = React.useRef(null);
      const draft = typeof useInput === "function" ? useInput((state) => state.draft) : "";
      const visual = VISUAL.test(absolutePath || "");

      React.useEffect(() => {
        if (!active) return undefined;
        const onKey = (event) => {
          if (event.key === "Escape") {
            setActive(false);
            setBox(null);
            start.current = null;
          }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [active]);

      const appendDraft = (text) => {
        if (inputActions === undefined || typeof inputActions.setDraft !== "function") return false;
        const current = typeof draft === "string" ? draft : "";
        inputActions.setDraft(current.trim() === "" ? `${text}\n\n` : `${current}\n\n${text}\n\n`);
        return true;
      };

      const quote = () => {
        const selected = (window.getSelection()?.toString() ?? "").trim();
        if (selected === "") {
          setNotice(t("noSelection"));
          return;
        }
        const quoted = selected.split(/\r?\n/).map((line) => `> ${line}`).join("\n");
        setNotice(appendDraft(quoted) ? t("quoted") : t("failed"));
      };

      const onPointerDown = (event) => {
        event.preventDefault();
        start.current = { x: event.clientX, y: event.clientY };
        setBox({ x: event.clientX, y: event.clientY, w: 0, h: 0 });
        event.currentTarget.setPointerCapture?.(event.pointerId);
      };

      const onPointerMove = (event) => {
        if (start.current === null) return;
        setBox(rectBetween(start.current, { x: event.clientX, y: event.clientY }));
      };

      const onPointerUp = async (event) => {
        if (start.current === null) return;
        const selection = rectBetween(start.current, { x: event.clientX, y: event.clientY });
        start.current = null;
        setActive(false);
        setBox(null);
        if (selection.w < 4 || selection.h < 4) {
          setNotice(t("tooSmall"));
          return;
        }
        try {
          const file = await capture(selection);
          if (typeof createDrafts !== "function") throw new Error("conversation");
          const ids = createDrafts([file]);
          if (inputActions === undefined || typeof inputActions.addAttachments !== "function"
            || inputActions.addAttachments(ids) === false) {
            throw new Error("attach");
          }
          if ((typeof draft !== "string" || draft.trim() === "") && typeof inputActions.setDraft === "function") {
            inputActions.setDraft(t("prompt"));
          }
          setNotice(t("added"));
        } catch (error) {
          console.error("preview-snip", error);
          const message = error instanceof Error ? error.message : String(error);
          if (message === "too-small" || message === "hit-empty") {
            setNotice(t("tooSmall"));
          } else if (message === "no-visual" || message === "natural-zero") {
            setNotice(t("noVisual"));
          } else {
            setNotice(`${t("failed")}: ${message}`);
          }
        }
      };

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "span",
          { "data-preview-snip": true },
          visual
            ? React.createElement(
                "button",
                { type: "button", title: t("snip"), onClick: () => setActive(true) },
                t("snip")
              )
            : null,
          React.createElement(
            "button",
            {
              type: "button",
              title: t("quote"),
              onMouseDown: (event) => event.preventDefault(),
              onClick: quote
            },
            t("quote")
          ),
          notice !== "" ? React.createElement("span", { "data-snip-notice": true }, notice) : null
        ),
        active
          ? React.createElement(
              "div",
              {
                "data-preview-snip-overlay": true,
                onPointerDown,
                onPointerMove,
                onPointerUp
              },
              React.createElement("span", { "data-preview-snip-hint": true }, t("hint")),
              box === null
                ? null
                : React.createElement("div", {
                    "data-preview-snip-box": true,
                    style: { left: box.x, top: box.y, width: box.w, height: box.h }
                  })
            )
          : null
      );
    }

    const inject = ["slots", "locale", "sessions"];

    function apply(ctx) {
      installStyle();
      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "preview-snip: dictionaries");
      ctx.slots.inject("sidebar.right.tab.document.actions", () =>
        ctx.slots.register(
          {
            name: "sidebar.right.tab.document.actions",
            id: "preview-snip",
            order: 30,
            locale: NS,
            inject: (sessionId) => {
              const scope = ctx.sessions?.scope?.(sessionId);
              const conversation = scope?.get?.("conversation");
              return {
                createDrafts: (files) => {
                  if (conversation === undefined) throw new Error("conversation unavailable");
                  return conversation.createDrafts(sessionId, files).map((draft) => draft.id);
                }
              };
            }
          },
          SnipAction
        )
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
