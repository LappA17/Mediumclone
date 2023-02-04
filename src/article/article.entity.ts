import {
	BeforeUpdate,
	Column,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@app/user/user.entity';

@Entity({ name: 'articles' })
export class ArticleEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	slug: string;

	@Column()
	title: string;

	@Column({ default: '' })
	description: string;

	@Column({ default: '' })
	body: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	updateAt: Date;

	@Column('simple-array')
	tagList: string[];

	@Column({ default: 0 })
	favouritesCounts: number; //сколько раз пользователь лайкнули пост

	@BeforeUpdate()
	updateTimeStamp() {
		this.updateAt = new Date();
	}

	@ManyToOne(() => UserEntity, (user) => user.articles, { eager: true })
	author: UserEntity;
}

/*
@Column({ type: 'timestamp' }) так мы явно указываем что это дата

default: () => 'CURRENT_TIMESTAMP' - это значит что этот декоратор, когда мы создадим к примеру createdAt, при создании нашей записи автоматически заполнит поле createdAt, и это будет timestamp те дата, и внутри будет дефолтное значение при создание CURRENT_TIMESTAMP - те текущая дата

При создание updateAt у нас возникает проблема что сам по себе он меняться не будет
По-этому мы воспользуемся декоратором BeforeUpdate

Дальше нам нужно новую сущность создать в БД
yarn db:create src/migrations/CreateArticle
yarn db:migrate чтобы применить все миграции

Здесь мы переходи к relations, потому что наша сущность article на прямую зависит от user, потому что конкретный user с кокнретным id только может создать article и нам нужно их объеденить, у нас один пост - принадлежит одному автору, и нам нужно хранить айдишник пользователя которому пренадлежит данный article
Нас интересует связь один ко многим - один юзер может создать много артиклс - это значит что айдишник пользователя будет передаваться во все артикалс которые он создал

@ManyToOne(() => UserEntity, user => user.articles) - здесь мы явно указали что у нас один юзер и много артиколов

Теперь создадим новую миграцию потому что мы изменили entity
yarn db:create src/migrations/AddRelationsBetweenArticleAndUser
yarn db:migrate

mediumclone=# \d articles;
                                           Table "public.articles"
      Column      |            Type             | Collation | Nullable |               Default
------------------+-----------------------------+-----------+----------+--------------------------------------
 id               | integer                     |           | not null | nextval('articles_id_seq'::regclass)
 slug             | character varying           |           | not null |
 title            | character varying           |           | not null |
 description      | character varying           |           | not null | ''::character varying
 body             | character varying           |           | not null | ''::character varying
 createdAt        | timestamp without time zone |           | not null | now()
 updateAt         | timestamp without time zone |           | not null | now()
 tagList          | text                        |           | not null |
 favouritesCounts | integer                     |           | not null | 0
 authorId         | integer                     |           |          |
Indexes:
    "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES users(id)

У нас появилось authorId и FOREIGN KEY те внешняя связь

{ eager: true } - значит что мы будем всегда с нашим постом загружать автора
*/
