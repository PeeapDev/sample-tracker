import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/models.dart';

/// Builds and prints QR labels. Each label shows the QR code plus a two-line,
/// human-readable caption so a sheet of batch labels stays distinguishable:
///   line 1: the sampleId (the code the scanners read)
///   line 2: sampleType · diseaseProgram
///
/// The QR is generated straight from the sampleId STRING via the pdf package's
/// built-in barcode — not decoded from the base64 `qrCode` data URL. The
/// scanners read the sampleId, so this is equivalent and renders crisper.
class LabelPrinter {
  /// Print one label per sample (works for a single sample or a whole set/box).
  static Future<void> printSampleLabels(List<SampleModel> samples) async {
    final labels = samples
        .map((s) => _LabelData(
              code: s.sampleId,
              line: '${s.sampleType} · ${s.diseaseProgram}',
            ))
        .toList();
    await _layout(labels, title: 'sample-labels');
  }

  /// Print a single box/batch label — the box's own QR (from its batchId) plus
  /// the batchId caption — so the package itself can be scanned (BOX-…).
  static Future<void> printBatchLabel(String batchId, {String? subtitle}) async {
    await _layout(
      [_LabelData(code: batchId, line: subtitle ?? 'Box / batch')],
      title: 'box-label',
    );
  }

  /// Lay out the labels as a grid of cards and hand the PDF to the OS print /
  /// share sheet via the printing package.
  static Future<void> _layout(List<_LabelData> labels,
      {required String title}) async {
    final doc = pw.Document();
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (context) => [
          pw.Wrap(
            spacing: 12,
            runSpacing: 12,
            children: labels.map(_buildCard).toList(),
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      name: title,
      onLayout: (format) => doc.save(),
    );
  }

  /// One label card: QR generated from the code string + the two-line caption.
  static pw.Widget _buildCard(_LabelData label) {
    return pw.Container(
      width: 160,
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(width: 0.5),
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          pw.BarcodeWidget(
            barcode: pw.Barcode.qrCode(),
            data: label.code,
            width: 120,
            height: 120,
          ),
          pw.SizedBox(height: 8),
          pw.Text(
            label.code,
            textAlign: pw.TextAlign.center,
            style: pw.TextStyle(
              fontSize: 9,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
          pw.SizedBox(height: 2),
          pw.Text(
            label.line,
            textAlign: pw.TextAlign.center,
            style: const pw.TextStyle(fontSize: 8),
          ),
        ],
      ),
    );
  }
}

/// A single label's printable content.
class _LabelData {
  const _LabelData({required this.code, required this.line});
  final String code; // sampleId or batchId — what the QR encodes and captions
  final String line; // the second caption line (type · program, or box note)
}
