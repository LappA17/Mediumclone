import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1666679685412 implements MigrationInterface {
	name = 'SeedDb1666679685412';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
		  INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')
		`);

		await queryRunner.query(
			//password is и сам пароль что бы мы его не забыли
			//потому что здесь у нас захешированный пароль
			`
		  INSERT INTO users (username, email, password) VALUES ('Jacob', 'Jacob@gmail.com', '$2b$10$EFpgL/GFJ4iRSeP3w5ZKDeZKbGWA6uB8S3GF5Hd1GktUU76NrfYP.')
		`,
		);

		await queryRunner.query(`
		  INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First article', 'first article description', 'first article body', 'coffee,dragons', 1)
		`);

		await queryRunner.query(`
		  INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('second-article', 'Second article', 'Second article description', 'Second article body', 'coffee,dragons', 1)
		`);
	}

	public async down(): Promise<void> {}
}
