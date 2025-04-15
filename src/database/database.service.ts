import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
    constructor(@InjectConnection() private readonly connection: Connection) {}

    async onModuleInit() {
        try {
            const queryRunner = this.connection.createQueryRunner();
            const result = await this.connection.query('SELECT NOW()');
            await queryRunner.connect();
            try {
                await this.down(queryRunner);
                await this.up(queryRunner);
            } catch (error) {
                console.error('Error creating indexes:', error);
            } finally {
                await queryRunner.release();
            }

            console.log('Database connection successful:', result);
        } catch (error) {
            console.error('Database connection failed:', error);
        }
    }

    protected async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        await queryRunner.query("CREATE INDEX idx_jobs_name_gin ON jobs USING GIN(to_tsvector('english', name));");
        await queryRunner.query('CREATE INDEX idx_addresses_country ON addresses (country);');
        await queryRunner.query('CREATE INDEX idx_addresses_city ON addresses (city);');
        await queryRunner.query(
            'CREATE INDEX idx_addresses_mixed_address ON addresses USING GIN(mixed_address gin_trgm_ops);'
        );
        await queryRunner.query('CREATE INDEX idx_job_categories_category_id ON job_categories (category_id);');
        await queryRunner.query(
            'CREATE INDEX idx_job_specializations_category_id ON job_specializations (category_id);'
        );
    }

    protected async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS idx_job_specializations_category_id;');
        await queryRunner.query('DROP INDEX IF EXISTS idx_job_categories_category_id;');
        await queryRunner.query('DROP INDEX IF EXISTS idx_addresses_city;');
        await queryRunner.query('DROP INDEX IF EXISTS idx_addresses_country;');
        await queryRunner.query('DROP INDEX IF EXISTS idx_jobs_name_gin;');
        await queryRunner.query('DROP EXTENSION IF EXISTS unaccent;');
    }
}
