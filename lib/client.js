/**
 * dsh-preview-snip browser half.
 *
 * Adds three actions to the document-preview header:
 * - 圈选: drag a rectangle, crop it to PNG, and attach it to the composer.
 * - 全能圈选: drag a rectangle, then annotate the crop (box / ellipse / arrow /
 *   text, colors, undo) before attaching it.
 * - 引用选中: quote the current text selection into the composer.
 *
 * Pixel capture works for <img>, <video> and <canvas> (images, PDF pages, 3D
 * viewports and video frames). Everything else falls back to a DOM-to-SVG
 * screenshot of the preview pane, so the actions exist for every preview type.
 */
window.__ModuleLoader__.load({
  id: "dsh-preview-snip",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");

    const NS = "previewSnip";
    const COLORS = ["#e11d48", "#f59e0b", "#2563eb", "#16a34a"];

    const zh = {
      snip: "圈选",
      full: "全能圈选",
      quote: "引用选中",
      hint: "拖拽框选预览区域，Esc 取消",
      hintFull: "拖拽框选后进入标注编辑器，Esc 取消",
      editor: "标注后插入",
      box: "方框",
      ellipse: "圆形",
      arrow: "箭头",
      text: "文字",
      undo: "撤销",
      clear: "清空",
      cancel: "取消",
      insert: "插入输入框",
      textPrompt: "输入要标注的文字",
      noVisual: "这个预览暂时无法截图",
      tooSmall: "圈选区域太小",
      noSelection: "先在预览里选中文字",
      added: "已把圈选图片插入输入框",
      quoted: "已引用选中文字",
      failed: "圈选失败",
      prompt: "请解释圈选区域的内容。"
    };

    const en = {
      snip: "Snip",
      full: "Annotate",
      quote: "Quote selection",
      hint: "Drag over the preview; Esc to cancel",
      hintFull: "Drag over the preview, then annotate; Esc to cancel",
      editor: "Insert annotated snip",
      box: "Box",
      ellipse: "Circle",
      arrow: "Arrow",
      text: "Text",
      undo: "Undo",
      clear: "Clear",
      cancel: "Cancel",
      insert: "Insert",
      textPrompt: "Text to annotate",
      noVisual: "This preview cannot be captured yet",
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
        "[data-preview-snip-hint]{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:100000;padding:6px 12px;border-radius:999px;font-size:12px;color:#fff;background:rgba(20,24,32,.82);pointer-events:none;white-space:nowrap}",
        "[data-snip-editor]{position:fixed;inset:0;z-index:100001;background:rgba(8,10,14,.72);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}",
        "[data-snip-editor] .snip-editor-panel{display:flex;flex-direction:column;gap:10px;max-width:94vw;max-height:92vh;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#1f2329);border-radius:12px;padding:12px;box-shadow:0 18px 60px rgba(0,0,0,.35)}",
        "[data-snip-editor] .snip-editor-toolbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}",
        "[data-snip-editor] .snip-editor-toolbar button{appearance:none;border:1px solid rgba(0,0,0,.12);border-radius:7px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer;background:transparent;color:inherit}",
        "[data-snip-editor] .snip-editor-toolbar button[data-active=true]{background:#2c6ef2;color:#fff;border-color:#2c6ef2}",
        "[data-snip-editor] .snip-editor-toolbar button[data-color]{width:22px;height:22px;padding:0;border-radius:999px}",
        "[data-snip-editor] .snip-editor-toolbar button[data-color][data-active=true]{outline:2px solid #111;outline-offset:2px}",
        "[data-snip-editor] .snip-editor-spacer{flex:1 1 auto}",
        "[data-snip-editor] .snip-editor-textbar{display:flex;gap:6px;align-items:center}",
        "[data-snip-editor] .snip-editor-textbar input{flex:1 1 auto;min-width:180px;border:1px solid rgba(0,0,0,.18);border-radius:7px;padding:6px 8px;font:inherit;font-size:12px;background:transparent;color:inherit}",
        "[data-snip-editor] .snip-editor-textbar button{appearance:none;border:1px solid rgba(0,0,0,.12);border-radius:7px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer;background:transparent;color:inherit}",
        "[data-snip-editor] canvas{display:block;max-width:90vw;max-height:72vh;width:auto;height:auto;background:#fff;border-radius:8px;cursor:crosshair;touch-action:none}",
        "[data-snip-editor] .snip-editor-hint{font-size:11px;opacity:.55}"
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

    /** The displayed content box of an object-fit: contain image/video. */
    function containBox(rect, naturalWidth, naturalHeight) {
      if (!(naturalWidth > 0) || !(naturalHeight > 0)) return rect;
      const scale = Math.min(rect.w / naturalWidth, rect.h / naturalHeight);
      const w = naturalWidth * scale;
      const h = naturalHeight * scale;
      return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
    }

    /**
     * Pick the visible pixel source under the selection: image, video frame or
     * canvas. The preview lives on the right; tiny icons are filtered by size.
     */
    function findPixelTarget(selection) {
      const rightSide = window.innerWidth * 0.45;
      let best = null;
      let bestArea = 0;
      for (const element of document.querySelectorAll("img,video,canvas")) {
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

    function sourceMetrics(target) {
      const box = target.getBoundingClientRect();
      const rect = { x: box.x, y: box.y, w: box.width, h: box.height };
      if (target.tagName === "IMG") {
        return { rect, content: containBox(rect, target.naturalWidth, target.naturalHeight), sw: target.naturalWidth, sh: target.naturalHeight };
      }
      if (target.tagName === "VIDEO") {
        return { rect, content: containBox(rect, target.videoWidth, target.videoHeight), sw: target.videoWidth, sh: target.videoHeight };
      }
      return { rect, content: rect, sw: target.width, sh: target.height };
    }

    async function cropTarget(target, selection) {
      const metrics = sourceMetrics(target);
      if (!(metrics.sw > 0) || !(metrics.sh > 0)) throw new Error("no-visual");
      const hit = intersection(selection, metrics.content);
      if (hit === null || hit.w < 4 || hit.h < 4) throw new Error("too-small");
      const sx = ((hit.x - metrics.content.x) / metrics.content.w) * metrics.sw;
      const sy = ((hit.y - metrics.content.y) / metrics.content.h) * metrics.sh;
      const sw = (hit.w / metrics.content.w) * metrics.sw;
      const sh = (hit.h / metrics.content.h) * metrics.sh;
      const outWidth = Math.max(1, Math.min(1800, Math.round(sw)));
      const outHeight = Math.max(1, Math.round((sh * outWidth) / sw));
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("canvas");
      context.drawImage(target, sx, sy, sw, sh, 0, 0, outWidth, outHeight);
      return canvas;
    }

    function cssText() {
      const chunks = [];
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules;
          if (rules === null) continue;
          for (const rule of rules) chunks.push(rule.cssText);
        } catch {
          // Cross-origin stylesheets are not readable; skip them.
        }
      }
      return chunks.join("\n");
    }

    /**
     * DOM-to-SVG capture for text/markdown/HTML previews. The stylesheet text is
     * embedded in the SVG so classes keep their appearance inside foreignObject.
     */
    async function captureDom(selection, anchor) {
      const overlay = document.querySelector("[data-preview-snip-overlay]");
      const previous = overlay === null ? null : overlay.style.visibility;
      if (overlay !== null) overlay.style.visibility = "hidden";
      try {
        const cx = selection.x + selection.w / 2;
        const cy = selection.y + selection.h / 2;
        let node = document.elementFromPoint(cx, cy);
        if (node === null && anchor !== null) node = anchor;
        const textBody = node?.closest?.("[data-textpreview-body]") ?? null;
        if (textBody !== null) node = textBody;
        let chosen = node;
        while (chosen !== null && chosen !== document.body && chosen !== document.documentElement) {
          const rect = chosen.getBoundingClientRect();
          if (rect.width >= 240 && rect.height >= 160 && rect.right > selection.x && rect.left < selection.x + selection.w) break;
          chosen = chosen.parentElement;
        }
        if (chosen === null || chosen === document.body || chosen === document.documentElement) {
          throw new Error("no-dom");
        }
        const box = chosen.getBoundingClientRect();
        const rect = { x: box.x, y: box.y, w: box.width, h: box.height };
        const hit = intersection(selection, rect);
        if (hit === null || hit.w < 4 || hit.h < 4) throw new Error("too-small");

        const clone = chosen.cloneNode(true);
        clone.style.margin = "0";
        clone.style.width = `${rect.w}px`;
        clone.style.height = `${rect.h}px`;
        clone.style.overflow = "hidden";
        clone.style.boxSizing = "border-box";
        const background = getComputedStyle(chosen).backgroundColor;
        const markup = new XMLSerializer().serializeToString(clone);
        const css = cssText().replaceAll("]]>", "]] >");
        const inner = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${rect.w}px;height:${rect.h}px;overflow:hidden;background:${background};position:relative">`
          + `<div style="position:absolute;left:${-chosen.scrollLeft}px;top:${-chosen.scrollTop}px;width:${chosen.scrollWidth}px;height:${chosen.scrollHeight}px">`
          + `<style><![CDATA[${css}]]></style>${markup}</div></div>`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.w}" height="${rect.h}">`
          + `<foreignObject x="0" y="0" width="100%" height="100%">${inner}</foreignObject></svg>`;
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(hit.w));
        canvas.height = Math.max(1, Math.round(hit.h));
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("canvas");
        context.drawImage(image, hit.x - rect.x, hit.y - rect.y, hit.w, hit.h, 0, 0, canvas.width, canvas.height);
        return canvas;
      } finally {
        if (overlay !== null) overlay.style.visibility = previous ?? "";
      }
    }

    async function captureSelection(selection, anchor) {
      const target = findPixelTarget(selection);
      if (target !== null) return cropTarget(target, selection);
      return captureDom(selection, anchor);
    }

    function canvasToFile(canvas) {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob === null) reject(new Error("encode"));
          else resolve(new File([blob], `preview-snip-${Date.now()}.png`, { type: "image/png" }));
        }, "image/png");
      });
    }

    function drawShape(context, shape, lineWidth, font) {
      context.save();
      context.strokeStyle = shape.color;
      context.fillStyle = shape.color;
      context.lineWidth = lineWidth;
      context.lineCap = "round";
      context.lineJoin = "round";
      const x = Math.min(shape.x1, shape.x2);
      const y = Math.min(shape.y1, shape.y2);
      const w = Math.abs(shape.x2 - shape.x1);
      const h = Math.abs(shape.y2 - shape.y1);
      if (shape.type === "rect") {
        context.strokeRect(x, y, w, h);
      } else if (shape.type === "ellipse") {
        context.beginPath();
        context.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        context.stroke();
      } else if (shape.type === "arrow") {
        context.beginPath();
        context.moveTo(shape.x1, shape.y1);
        context.lineTo(shape.x2, shape.y2);
        context.stroke();
        const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
        const head = Math.max(10, lineWidth * 3);
        context.beginPath();
        context.moveTo(shape.x2, shape.y2);
        context.lineTo(shape.x2 - head * Math.cos(angle - 0.5), shape.y2 - head * Math.sin(angle - 0.5));
        context.moveTo(shape.x2, shape.y2);
        context.lineTo(shape.x2 - head * Math.cos(angle + 0.5), shape.y2 - head * Math.sin(angle + 0.5));
        context.stroke();
      } else if (shape.type === "text") {
        context.font = `600 ${font}px sans-serif`;
        context.textBaseline = "top";
        context.fillText(shape.text, shape.x1, shape.y1);
      }
      context.restore();
    }

    function SnipEditor({ src, width, height, t, onCancel, onCommit }) {
      const canvasRef = React.useRef(null);
      const imageRef = React.useRef(null);
      const startRef = React.useRef(null);
      const [tool, setTool] = React.useState("rect");
      const [color, setColor] = React.useState(COLORS[0]);
      const [shapes, setShapes] = React.useState([]);
      const [draft, setDraft] = React.useState(null);
      const [textAt, setTextAt] = React.useState(null);
      const [textValue, setTextValue] = React.useState("");
      const [busy, setBusy] = React.useState(false);

      const redraw = React.useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (canvas === null || image === null) return;
        const context = canvas.getContext("2d");
        if (context === null) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const lineWidth = Math.max(4, canvas.width / 260);
        const font = Math.max(22, canvas.width / 28);
        for (const shape of shapes) drawShape(context, shape, lineWidth, font);
        if (draft !== null) drawShape(context, draft, lineWidth, font);
      }, [shapes, draft]);

      React.useEffect(() => {
        const image = new Image();
        image.onload = () => {
          imageRef.current = image;
          const canvas = canvasRef.current;
          if (canvas !== null) {
            canvas.width = width;
            canvas.height = height;
            redraw();
          }
        };
        image.src = src;
      }, [src, width, height, redraw]);

      React.useEffect(() => {
        redraw();
      }, [redraw]);

      const pointOf = (event) => {
        const canvas = canvasRef.current;
        if (canvas === null) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
          x: ((event.clientX - rect.left) / rect.width) * canvas.width,
          y: ((event.clientY - rect.top) / rect.height) * canvas.height
        };
      };

      const onPointerDown = (event) => {
        event.preventDefault();
        const point = pointOf(event);
        if (tool === "text") {
          setTextAt(point);
          setTextValue("");
          return;
        }
        startRef.current = point;
        setDraft({ type: tool, x1: point.x, y1: point.y, x2: point.x, y2: point.y, color });
        event.currentTarget.setPointerCapture?.(event.pointerId);
      };

      const onPointerMove = (event) => {
        if (startRef.current === null) return;
        const point = pointOf(event);
        setDraft((previous) => previous === null ? null : { ...previous, x2: point.x, y2: point.y });
      };

      const onPointerUp = () => {
        if (startRef.current === null) return;
        startRef.current = null;
        setDraft((previous) => {
          if (previous !== null && Math.abs(previous.x2 - previous.x1) > 2 && Math.abs(previous.y2 - previous.y1) > 2) {
            setShapes((shapesNow) => [...shapesNow, previous]);
          }
          return null;
        });
      };

      const insert = async () => {
        const canvas = canvasRef.current;
        if (canvas === null) return;
        setBusy(true);
        try {
          await onCommit(await canvasToFile(canvas));
        } finally {
          setBusy(false);
        }
      };

      const addText = () => {
        if (textAt === null || textValue.trim() === "") return;
        setShapes((previous) => [...previous, {
          type: "text",
          x1: textAt.x,
          y1: textAt.y,
          x2: textAt.x,
          y2: textAt.y,
          text: textValue,
          color
        }]);
        setTextAt(null);
        setTextValue("");
      };

      return React.createElement(
        "div",
        { "data-snip-editor": true, "data-snip-shapes": shapes.length },
        React.createElement(
          "div",
          { className: "snip-editor-panel" },
          React.createElement(
            "div",
            { className: "snip-editor-toolbar" },
            React.createElement("button", { type: "button", "data-active": tool === "rect", onClick: () => setTool("rect") }, t("box")),
            React.createElement("button", { type: "button", "data-active": tool === "ellipse", onClick: () => setTool("ellipse") }, t("ellipse")),
            React.createElement("button", { type: "button", "data-active": tool === "arrow", onClick: () => setTool("arrow") }, t("arrow")),
            React.createElement("button", { type: "button", "data-active": tool === "text", onClick: () => setTool("text") }, t("text")),
            ...COLORS.map((value) =>
              React.createElement("button", {
                key: value,
                type: "button",
                "data-color": true,
                "data-active": color === value,
                title: value,
                style: { background: value },
                onClick: () => setColor(value)
              })
            ),
            React.createElement("span", { className: "snip-editor-spacer" }),
            React.createElement("button", { type: "button", onClick: () => setShapes((previous) => previous.slice(0, -1)) }, t("undo")),
            React.createElement("button", { type: "button", onClick: () => setShapes([]) }, t("clear")),
            React.createElement("button", { type: "button", onClick: onCancel }, t("cancel")),
            React.createElement("button", { type: "button", disabled: busy, onClick: () => void insert() }, busy ? "…" : t("insert"))
          ),
          textAt === null
            ? null
            : React.createElement(
                "div",
                { className: "snip-editor-textbar" },
                React.createElement("input", {
                  autoFocus: true,
                  value: textValue,
                  placeholder: t("textPrompt"),
                  onChange: (event) => setTextValue(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === "Enter") addText();
                    if (event.key === "Escape") setTextAt(null);
                  }
                }),
                React.createElement("button", { type: "button", onClick: addText }, t("insert")),
                React.createElement("button", { type: "button", onClick: () => setTextAt(null) }, t("cancel"))
              ),
          React.createElement("canvas", {
            ref: canvasRef,
            width,
            height,
            onPointerDown,
            onPointerMove,
            onPointerUp
          }),
          React.createElement("p", { className: "snip-editor-hint" }, t("editor"))
        )
      );
    }

    function SnipAction({ absolutePath, inputActions, useInput, createDrafts, t }) {
      const [active, setActive] = React.useState(false);
      const [mode, setMode] = React.useState("quick");
      const [box, setBox] = React.useState(null);
      const [notice, setNotice] = React.useState("");
      const [editor, setEditor] = React.useState(null);
      const start = React.useRef(null);
      const rootRef = React.useRef(null);
      const draft = typeof useInput === "function" ? useInput((state) => state.draft) : "";

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

      const begin = (nextMode) => {
        setMode(nextMode);
        setActive(true);
        setBox(null);
        setNotice("");
        start.current = null;
      };

      const attach = async (file) => {
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
      };

      const quote = () => {
        const selected = (window.getSelection()?.toString() ?? "").trim();
        if (selected === "") {
          setNotice(t("noSelection"));
          return;
        }
        const quoted = selected.split(/\r?\n/).map((line) => `> ${line}`).join("\n");
        const current = typeof draft === "string" ? draft : "";
        if (inputActions === undefined || typeof inputActions.setDraft !== "function") {
          setNotice(t("failed"));
          return;
        }
        inputActions.setDraft(current.trim() === "" ? `${quoted}\n\n` : `${current}\n\n${quoted}\n\n`);
        setNotice(t("quoted"));
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
          const canvas = await captureSelection(selection, rootRef.current);
          if (mode === "full") {
            setEditor({ src: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
          } else {
            await attach(await canvasToFile(canvas));
          }
        } catch (error) {
          console.error("preview-snip", error);
          const message = error instanceof Error ? error.message : String(error);
          if (message === "too-small" || message === "hit-empty") setNotice(t("tooSmall"));
          else setNotice(t("noVisual"));
        }
      };

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "span",
          { "data-preview-snip": true, ref: rootRef },
          React.createElement("button", { type: "button", title: t("snip"), onClick: () => begin("quick") }, t("snip")),
          React.createElement("button", { type: "button", title: t("full"), onClick: () => begin("full") }, t("full")),
          React.createElement(
            "button",
            { type: "button", title: t("quote"), onMouseDown: (event) => event.preventDefault(), onClick: quote },
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
              React.createElement("span", { "data-preview-snip-hint": true }, mode === "full" ? t("hintFull") : t("hint")),
              box === null
                ? null
                : React.createElement("div", {
                    "data-preview-snip-box": true,
                    style: { left: box.x, top: box.y, width: box.w, height: box.h }
                  })
            )
          : null,
        editor === null
          ? null
          : React.createElement(SnipEditor, {
              src: editor.src,
              width: editor.width,
              height: editor.height,
              t,
              onCancel: () => setEditor(null),
              onCommit: async (file) => {
                await attach(file);
                setEditor(null);
              }
            })
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
