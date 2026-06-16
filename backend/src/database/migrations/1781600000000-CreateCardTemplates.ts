import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates the `card_templates` table behind the ID Card Designer. In dev this
// table is auto-created by `synchronize`; this migration is what provisions it
// where synchronize is off (production / Supabase). IF NOT EXISTS keeps it safe
// to run against an environment where synchronize already created the table.
export class CreateCardTemplates1781600000000 implements MigrationInterface {
  name = 'CreateCardTemplates1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // @PrimaryGeneratedColumn('uuid') emits uuid_generate_v4(); ensure the
    // extension exists (already present where other uuid tables were created).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "card_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "layout" jsonb NOT NULL DEFAULT '{}',
        "createdBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_card_templates" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "card_templates"`);
  }
}
