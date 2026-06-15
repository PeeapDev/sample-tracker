// Print QR labels (single or a whole set/batch). Each label shows the QR image
// plus a human-readable caption so a stack of printed labels stays
// distinguishable: the code on one line, "type · program" on the next.

export interface PrintLabel {
  code: string // sampleId or batchId — printed under the QR
  qrCode?: string // base64 PNG data URL of the QR
  line2?: string // e.g. "Blood · Malaria"
}

export function printLabels(labels: PrintLabel[], title = 'QR Labels') {
  const printable = labels.filter((l) => l.qrCode)
  if (printable.length === 0) return

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return

  const cards = printable
    .map(
      (l) => `
      <div class="label">
        <img src="${l.qrCode}" alt="${l.code}" />
        <div class="code">${l.code}</div>
        ${l.line2 ? `<div class="meta">${l.line2}</div>` : ''}
      </div>`,
    )
    .join('')

  // Wait for the QR images to decode before printing, otherwise the print
  // dialog can fire on blank <img>s.
  w.document.write(`<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <style>
      @page { margin: 8mm; }
      * { box-sizing: border-box; }
      body { font-family: system-ui, sans-serif; margin: 0; padding: 12px; }
      .grid { display: flex; flex-wrap: wrap; gap: 10px; }
      .label {
        width: 180px; border: 1px solid #ddd; border-radius: 8px;
        padding: 10px; text-align: center; break-inside: avoid;
      }
      .label img { width: 150px; height: 150px; image-rendering: pixelated; }
      .code { font-family: ui-monospace, monospace; font-weight: 700; font-size: 13px; margin-top: 6px; word-break: break-all; }
      .meta { color: #555; font-size: 11px; margin-top: 2px; }
    </style>
  </head>
  <body>
    <div class="grid">${cards}</div>
    <script>
      (function () {
        var imgs = Array.prototype.slice.call(document.images);
        var left = imgs.length;
        function go() { window.focus(); window.print(); }
        if (left === 0) return go();
        imgs.forEach(function (img) {
          if (img.complete) { if (--left === 0) go(); }
          else img.addEventListener('load', function () { if (--left === 0) go(); });
        });
        setTimeout(go, 1500); // fallback if a load event is missed
      })();
    </script>
  </body>
</html>`)
  w.document.close()
}
