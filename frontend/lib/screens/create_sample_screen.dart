import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sample_provider.dart';

class CreateSampleScreen extends StatefulWidget {
  const CreateSampleScreen({super.key});

  @override
  State<CreateSampleScreen> createState() => _CreateSampleScreenState();
}

class _CreateSampleScreenState extends State<CreateSampleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _sampleTypeController = TextEditingController();
  final _diseaseProgramController = TextEditingController();
  final _quantityController = TextEditingController();
  final _villageController = TextEditingController();
  final _ageController = TextEditingController();
  final _notesController = TextEditingController();
  String _gender = 'Unknown';
  String _facilityId = '';

  @override
  void dispose() {
    _sampleTypeController.dispose();
    _diseaseProgramController.dispose();
    _quantityController.dispose();
    _villageController.dispose();
    _ageController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<SampleProvider>();
    final success = await provider.createSample({
      'sampleType': _sampleTypeController.text.trim(),
      'diseaseProgram': _diseaseProgramController.text.trim(),
      'quantity': int.parse(_quantityController.text.trim()),
      'facilityId': _facilityId.isNotEmpty ? _facilityId : '00000000-0000-0000-0000-000000000001',
      'village': _villageController.text.trim().isEmpty ? null : _villageController.text.trim(),
      'patientAge': _ageController.text.trim().isEmpty ? null : int.tryParse(_ageController.text.trim()),
      'patientGender': _gender,
      'notes': _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    });

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sample registered successfully'), backgroundColor: Colors.green),
      );
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final provider = context.watch<SampleProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Register Sample')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _sampleTypeController,
                decoration: const InputDecoration(
                  labelText: 'Sample Type',
                  hintText: 'e.g., Blood, Sputum, Stool',
                  prefixIcon: Icon(Icons.science),
                  border: OutlineInputBorder(),
                ),
                validator: (v) => v?.isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _diseaseProgramController,
                decoration: const InputDecoration(
                  labelText: 'Disease Program',
                  hintText: 'e.g., Malaria, TB, HIV',
                  prefixIcon: Icon(Icons.medical_services),
                  border: OutlineInputBorder(),
                ),
                validator: (v) => v?.isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _quantityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Quantity',
                  prefixIcon: Icon(Icons.inventory_2),
                  border: OutlineInputBorder(),
                ),
                validator: (v) {
                  if (v?.isEmpty == true) return 'Required';
                  if (int.tryParse(v!) == null || int.parse(v) < 1) return 'Min 1';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _villageController,
                decoration: const InputDecoration(
                  labelText: 'Village (optional)',
                  prefixIcon: Icon(Icons.location_on),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Patient Age',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _gender,
                      decoration: const InputDecoration(
                        labelText: 'Gender',
                        border: OutlineInputBorder(),
                      ),
                      items: ['Unknown', 'Male', 'Female']
                          .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                          .toList(),
                      onChanged: (v) => setState(() => _gender = v!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Notes (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: provider.isLoading ? null : _submit,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: provider.isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Register Sample', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
