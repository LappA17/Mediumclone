import {
	BeforeInsert,
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { hash } from 'bcrypt';
import { ArticleEntity } from '@app/article/article.entity';

@Entity({ name: 'users' })
export class UserEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	email: string;

	@Column()
	username: string;

	@Column({ default: '' })
	bio: string;

	@Column({ default: '' })
	image: string; //это будет url на картинку

	@Column({ select: false })
	password: string;

	@BeforeInsert()
	async hashPassword() {
		this.password = await hash(this.password, 10);
	}

	@OneToMany(() => ArticleEntity, (article) => article.author)
	articles: ArticleEntity[];

	@ManyToMany(() => ArticleEntity)
	@JoinTable()
	favorites: ArticleEntity[];
}

/*
    @Column({ default: '' }) - подефолту пустая строка и если при создание юзера bio не заполнялось то будет пустая строка

    @BeforeInsert() - позволяет нам что-то сделать переда вставкой самого документа

	@Column({select: false}) password: string; - что бы мы не возвращали пароль на Клиент ! То-есть мы исключаем пароль при всех взаимодействиях с find, findOne и тд

	@ManyToManu(() => ArticleEntity) - этим самым мы указываем что у нас есть ManyToMany асоциация между пользователем и постом
	favorites: ArticleEntity[]; - это массив тех статей которые пользователей залайкал
	Потом пишем: yarn db:create src/migrations/AddFavoritesRelationsBetweenArticleAndUser
*/
