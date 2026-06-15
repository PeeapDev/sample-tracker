import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/admin_users_provider.dart';
import '../theme/responsive.dart';

const _roles = [
  ('admin', 'Administrator', Icons.admin_panel_settings, Color(0xFF6366F1)),
  ('collector', 'Sample Collector', Icons.science, Color(0xFF3B82F6)),
  ('dispatcher', 'Dispatcher', Icons.local_shipping, Color(0xFFF97316)),
  ('hub_officer', 'Hub Officer', Icons.warehouse, Color(0xFF8B5CF6)),
  ('lab_officer', 'Lab Officer', Icons.biotech, Color(0xFF14B8A6)),
];

(String, IconData, Color) _roleMeta(String role) {
  for (final r in _roles) {
    if (r.$1 == role) return (r.$2, r.$3, r.$4);
  }
  return (role, Icons.person, const Color(0xFF94A3B8));
}

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  String _query = '';
  String _roleFilter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<AdminUsersProvider>().loadUsers());
  }

  List<Map<String, dynamic>> _filtered(List<Map<String, dynamic>> users) {
    return users.where((u) {
      if (_roleFilter != 'all' && u['role'] != _roleFilter) return false;
      if (_query.isEmpty) return true;
      final q = _query.toLowerCase();
      final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.toLowerCase();
      final email = (u['email'] ?? '').toString().toLowerCase();
      return name.contains(q) || email.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final provider = context.watch<AdminUsersProvider>();
    final users = _filtered(provider.users);
    final maxWidth = context.isWide ? 1100.0 : double.infinity;
    final pad = context.responsive(mobile: 16.0, tablet: 24.0, desktop: 32.0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: provider.loadUsers,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openAddUser(context),
        icon: const Icon(Icons.person_add_alt_1),
        label: const Text('Add User'),
      ),
      body: SafeArea(
        child: provider.isLoading && provider.users.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: provider.loadUsers,
                child: ListView(
                  padding: EdgeInsets.fromLTRB(pad, pad, pad, pad + 80),
                  children: [
                    Center(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: maxWidth),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (provider.isDemo) _demoBanner(theme),
                            _summary(theme, provider.users),
                            const SizedBox(height: 16),
                            _toolbar(theme),
                            const SizedBox(height: 16),
                            if (provider.error != null)
                              _errorBox(theme, provider.error!)
                            else if (users.isEmpty)
                              _empty(theme)
                            else
                              _UserGrid(
                                users: users,
                                onToggle: (id, active) => provider
                                    .setActive(id, active),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _demoBanner(ThemeData theme) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.tertiaryContainer.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline,
              size: 18, color: theme.colorScheme.onTertiaryContainer),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Demo mode — changes stay on this device and are not saved to the database. '
              'Sign in with a real admin account to persist users.',
              style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onTertiaryContainer),
            ),
          ),
        ],
      ),
    );
  }

  Widget _summary(ThemeData theme, List<Map<String, dynamic>> users) {
    final total = users.length;
    final active = users.where((u) => u['isActive'] == true).length;
    final admins = users.where((u) => u['role'] == 'admin').length;

    Widget tile(String label, String value, IconData icon, Color color) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 10),
              Text(value,
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w800)),
              Text(label,
                  style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      );
    }

    return Row(
      children: [
        tile('Total Users', '$total', Icons.people_alt_rounded,
            const Color(0xFF6366F1)),
        const SizedBox(width: 12),
        tile('Active', '$active', Icons.verified_user_rounded,
            const Color(0xFF22C55E)),
        const SizedBox(width: 12),
        tile('Admins', '$admins', Icons.shield_rounded,
            const Color(0xFFF59E0B)),
      ],
    );
  }

  Widget _toolbar(ThemeData theme) {
    return LayoutBuilder(builder: (context, c) {
      final search = TextField(
        onChanged: (v) => setState(() => _query = v),
        decoration: const InputDecoration(
          hintText: 'Search by name or email',
          prefixIcon: Icon(Icons.search),
          isDense: true,
        ),
      );
      final filter = DropdownButtonFormField<String>(
        initialValue: _roleFilter,
        decoration: const InputDecoration(isDense: true),
        items: [
          const DropdownMenuItem(value: 'all', child: Text('All roles')),
          ..._roles.map((r) =>
              DropdownMenuItem(value: r.$1, child: Text(r.$2))),
        ],
        onChanged: (v) => setState(() => _roleFilter = v ?? 'all'),
      );
      if (c.maxWidth < 520) {
        return Column(
          children: [search, const SizedBox(height: 12), filter],
        );
      }
      return Row(
        children: [
          Expanded(flex: 2, child: search),
          const SizedBox(width: 12),
          Expanded(child: filter),
        ],
      );
    });
  }

  Widget _errorBox(ThemeData theme, String message) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: theme.colorScheme.onErrorContainer),
          const SizedBox(width: 12),
          Expanded(
            child: Text(message,
                style: TextStyle(color: theme.colorScheme.onErrorContainer)),
          ),
        ],
      ),
    );
  }

  Widget _empty(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.group_off_rounded,
                size: 48, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text('No users match your filters',
                style: theme.textTheme.titleSmall),
          ],
        ),
      ),
    );
  }

  Future<void> _openAddUser(BuildContext context) async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _AddUserSheet(),
    );
    if (created == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User created')),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// User grid / rows
// ---------------------------------------------------------------------------
class _UserGrid extends StatelessWidget {
  const _UserGrid({required this.users, required this.onToggle});
  final List<Map<String, dynamic>> users;
  final void Function(String id, bool active) onToggle;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final cols = c.maxWidth >= 760 ? 2 : 1;
      const gap = 12.0;
      final w = (c.maxWidth - gap * (cols - 1)) / cols;
      return Wrap(
        spacing: gap,
        runSpacing: gap,
        children: users
            .map((u) => SizedBox(
                width: w, child: _UserCard(user: u, onToggle: onToggle)))
            .toList(),
      );
    });
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({required this.user, required this.onToggle});
  final Map<String, dynamic> user;
  final void Function(String id, bool active) onToggle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final role = (user['role'] ?? '').toString();
    final (label, icon, color) = _roleMeta(role);
    final active = user['isActive'] == true;
    final first = (user['firstName'] ?? '').toString();
    final last = (user['lastName'] ?? '').toString();
    final initials =
        '${first.isNotEmpty ? first[0] : ''}${last.isNotEmpty ? last[0] : ''}';
    final facility = (user['facility'] as Map?)?['name']?.toString();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: color.withValues(alpha: 0.16),
                  child: Text(
                    initials.isEmpty ? '?' : initials.toUpperCase(),
                    style: TextStyle(
                        color: color, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$first $last'.trim(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      Text(user['email']?.toString() ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (v) {
                    if (v == 'toggle') {
                      onToggle(user['id'].toString(), !active);
                    }
                  },
                  itemBuilder: (_) => [
                    PopupMenuItem(
                      value: 'toggle',
                      child: Row(
                        children: [
                          Icon(active ? Icons.block : Icons.check_circle,
                              size: 18),
                          const SizedBox(width: 10),
                          Text(active ? 'Deactivate' : 'Activate'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                _chip(theme, icon, label, color),
                const SizedBox(width: 8),
                _statusChip(theme, active),
              ],
            ),
            if (facility != null && facility.isNotEmpty) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(Icons.business_outlined,
                      size: 14, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(facility,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant)),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _chip(ThemeData theme, IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(
                  color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _statusChip(ThemeData theme, bool active) {
    final color =
        active ? const Color(0xFF22C55E) : theme.colorScheme.onSurfaceVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(active ? 'Active' : 'Inactive',
              style: TextStyle(
                  color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Add user bottom sheet
// ---------------------------------------------------------------------------
class _AddUserSheet extends StatefulWidget {
  const _AddUserSheet();

  @override
  State<_AddUserSheet> createState() => _AddUserSheetState();
}

class _AddUserSheetState extends State<_AddUserSheet> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _pin = TextEditingController();
  String _role = 'collector';
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _pin.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });

    final payload = <String, dynamic>{
      'firstName': _first.text.trim(),
      'lastName': _last.text.trim(),
      'email': _email.text.trim(),
      'password': _password.text,
      'role': _role,
      if (_phone.text.trim().isNotEmpty) 'phone': _phone.text.trim(),
      if (_pin.text.trim().isNotEmpty) 'pin': _pin.text.trim(),
    };

    final err =
        await context.read<AdminUsersProvider>().createUser(payload);
    if (!mounted) return;
    if (err == null) {
      Navigator.pop(context, true);
    } else {
      setState(() {
        _submitting = false;
        _error = err;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 4, 20, 20 + bottomInset),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Add User',
                  style: theme.textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('Create a new account on the platform',
                  style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _first,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'First name'),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _last,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Last name'),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                    labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  if (!v.contains('@')) return 'Invalid email';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                    labelText: 'Phone (optional)',
                    prefixIcon: Icon(Icons.phone_outlined)),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _role,
                decoration: const InputDecoration(
                    labelText: 'Role',
                    prefixIcon: Icon(Icons.badge_outlined)),
                items: _roles
                    .map((r) =>
                        DropdownMenuItem(value: r.$1, child: Text(r.$2)))
                    .toList(),
                onChanged: (v) => setState(() => _role = v ?? 'collector'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline)),
                validator: (v) => v == null || v.length < 6
                    ? 'Min 6 characters'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pin,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(
                    labelText: 'PIN (optional, for field login)',
                    prefixIcon: Icon(Icons.pin_outlined),
                    counterText: ''),
                validator: (v) => v != null && v.isNotEmpty && v.length < 4
                    ? 'Min 4 digits'
                    : null,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(_error!,
                      style: TextStyle(
                          color: theme.colorScheme.onErrorContainer)),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Create User'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
