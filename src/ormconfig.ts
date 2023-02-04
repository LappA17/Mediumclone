import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const config: PostgresConnectionOptions = {
	type: 'postgres',
	host: 'localhost',
	port: 5432,
	username: 'mediumclone',
	password: '123',
	database: 'mediumclone',
	entities: [__dirname + '/**/*.entity{.ts,.js}'],
	synchronize: false,
	migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
};

export default config;

/*
* Так мы сконкатинировали с текущий папкой и entities, у нас дирнейм(текущая папка) внутри продакшена будет уже не src, а dist по-этому мы явно не указываем что здесь папка src,
* А дальше мы говорим что будет любой файл где будет начало что-тотам.entity.ts или js
*
* synchronize в true означает что тайпорм каждый раз считывая наше приложения - создает под ниё таблицу

Саша сказал что эта опция synchronize: true плохая потому что она каждый раз сравнивает предыдущую и актуальную таблицу что бы создать новую
Дело в том что мы не видим что она там делает и это небезопасно особенно для Проды
Саша предлагает использовать миграции - это аналог ГИТа, у тебё создается папка с файлами и там показывается когда и как ты мигрировал что-то в свою БД

"db:drop": "npm run typeorm schema:drop" - такая команда в пакеджджсон удалит всю таблицу
"db:create": "npm run typeorm migrations:generate" - создаёт таблицу. В консоли пишем npm run db:create src/migrations/CreateTags
"db:migrate": "npm run typeorm migration:run" - делает новую миграцию с самыми новыми данными

*/
