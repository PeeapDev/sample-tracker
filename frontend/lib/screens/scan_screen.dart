import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';
import 'sample_detail_screen.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _scanController = TextEditingController();
  bool _isScanning = false;

  @override
  void dispose() {
    _scanController.dispose();
    super.dispose();
  }

  Future<void> _scanSample() async {
    final code = _scanController.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a sample ID or scan QR code')),
      );
      return;
    }

    setState(() => _isScanning = true);

    final provider = context.read<SampleProvider>();
    final sample = await provider.scanSample(code);

    setState(() => _isScanning = false);

    if (sample != null && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SampleDetailScreen(sampleId: sample.id),
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sample not found. Check the ID and try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Scan Sample')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  Icons.qr_code_scanner,
                  size: 80,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Scan Sample QR Code',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Scan the QR code on the sample container\nor enter the Sample ID manually',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _scanController,
                decoration: InputDecoration(
                  labelText: 'Sample ID',
                  hintText: 'e.g., NSR-ABC123-XY12',
                  prefixIcon: const Icon(Icons.qr_code),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.search),
                    onPressed: _isScanning ? null : _scanSample,
                  ),
                ),
                onSubmitted: (_) => _scanSample(),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _isScanning ? null : _scanSample,
                icon: _isScanning
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.search),
                label: Text(_isScanning ? 'Searching...' : 'Look Up Sample'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
