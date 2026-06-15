import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from '../../database/entities/role-permission.entity';
import { ALL_PERMISSIONS, DEFAULT_MATRIX } from './permissions.constants';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(
    @InjectRepository(RolePermission)
    private readonly repo: Repository<RolePermission>,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  /** Seed the default matrix the first time the table is empty. */
  async seedIfEmpty() {
    const count = await this.repo.count();
    if (count > 0) return;
    const rows: RolePermission[] = [];
    for (const [role, perms] of Object.entries(DEFAULT_MATRIX)) {
      for (const permission of perms) {
        rows.push(this.repo.create({ role, permission }));
      }
    }
    if (rows.length) await this.repo.save(rows);
  }

  /** role -> permission[] map, with super admin always granted everything. */
  async getMatrix(): Promise<Record<string, string[]>> {
    const rows = await this.repo.find();
    const matrix: Record<string, string[]> = {};
    for (const r of rows) {
      (matrix[r.role] ||= []).push(r.permission);
    }
    matrix.admin = [...ALL_PERMISSIONS];
    return matrix;
  }

  /** Replace the full permission set for a role (super admin is immutable). */
  async setRole(role: string, permissions: string[]): Promise<void> {
    if (role === 'admin') return;
    const valid = (permissions ?? []).filter((p) =>
      (ALL_PERMISSIONS as readonly string[]).includes(p),
    );
    await this.repo.delete({ role });
    if (valid.length) {
      await this.repo.save(valid.map((permission) => this.repo.create({ role, permission })));
    }
  }

  async resetDefaults(): Promise<void> {
    await this.repo.clear();
    await this.seedIfEmpty();
  }

  async can(role: string, permission: string): Promise<boolean> {
    if (role === 'admin') return true;
    const found = await this.repo.findOne({ where: { role, permission } });
    return !!found;
  }
}
