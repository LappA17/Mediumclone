import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, getRepository, Repository } from 'typeorm';
import { ArticleEntity } from '@app/article/article.entity';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { UserEntity } from '@app/user/user.entity';
import { ArticleResponseInterface } from '@app/types/articleResponse.interface';
import slugify from 'slugify';
import { ArticlesResponseInterface } from '@app/types/articlesResponse.interface';
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ArticleService {
	constructor(
		@InjectRepository(ArticleEntity) private readonly articleRepository: Repository<ArticleEntity>,
		@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>,
		private dataSource: DataSource,
	) {}

	async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
		const queryBuilder = this.dataSource
			.getRepository(ArticleEntity)
			.createQueryBuilder('articles')
			.leftJoinAndSelect('articles.author', 'author');
		if (query.tag) {
			queryBuilder.andWhere('articles.tagList LIKE :tag', {
				tag: `%${query.tag}%`,
				//то что мы написали вверху будет аналогом записи ниже
				//select * from articles where "tagList" LIKE 'dragons'
			});
		}
		if (query.author) {
			const author = await this.userRepository.findOne({
				where: {
					username: query.author, //query.author - то что мы получили из наших Квери параметров
				},
			});
			if (!author) throw new HttpException(`No author found`, HttpStatus.NOT_FOUND);
			queryBuilder.andWhere('articles.authorId = :id', {
				id: author.id,
			});
		}
		if (query.favorited) {
			const author = await this.userRepository.findOne({
				where: {
					username: query.favorited,
				},
				relations: ['favorires'],
			});
			//получим все айди постой который залайкал автор
			const ids = author?.favorites.map((el) => el.id);
			if (ids && ids.length > 0) {
				//мы у кажддого article проверям id, и что этот id находится в массиве наших айдшников
				queryBuilder.andWhere('articles.id IN (:...ids)', { ids });
			} else {
				//здесь мы задаём условие которое никогда не выполнится
				//это самый простой способ оборвать queryBuilder
				queryBuilder.andWhere('1=0');
			}
		}
		queryBuilder.orderBy('articles.createdAt', 'DESC');
		const articlesCount = await queryBuilder.getCount();
		if (query.limit) {
			queryBuilder.limit(query.limit);
		}
		if (query.offset) {
			queryBuilder.offset(query.offset);
		}
		let favoriteIds: number[] | undefined = [];
		if (currentUserId) {
			const currentUser = await this.userRepository.findOne({
				where: { id: currentUserId },
				relations: ['favorites'],
			});
			favoriteIds = currentUser?.favorites.map((favorite) => favorite.id);
		}
		const articles = await queryBuilder.getMany();
		const articlesWithFavorites = articles.map((article) => {
			const favorited = favoriteIds?.includes(article.id);
			return { ...article, favorited };
		});
		return { articles: articlesWithFavorites, articlesCount };
	}

	async getFeed(currentUserId: number, query: any) {
		//follow нам вернёт всех following который фолловит наш текукщий user
		const follows = await this.followRepository.find({
			where: {
				followerId: currentUserId, //передаём текущего пользователя
			},
		});
		if (follows.length === 0) {
			return { articles: [], articlesCount: 0 };
		}
		//получим айдишники всех юзером которых фоловит currentUser
		const followingUserIds = follows.map((f) => f.followingId);
		//что бы обращаться к квери параметрам, нам typeorm уже не поможет, нужно делать queryBuilder
		//leftJoin делаем что бы получить автора
		//если мы не укажем where то нам вернутся абсолютно все посты, в where мы укажем что мы получаем посты где authorId находится в нашем массиве
		//на место ids подставится followingUserIds
		const queryBuilder = this.dataSource
			.getRepository(ArticleEntity)
			.createQueryBuilder('articles')
			.leftJoinAndSelect('articles.author', 'author')
			.where('articles.authorId IN (:...ids)', { ids: followingUserIds });

		queryBuilder.orderBy('articles.createdAt', 'DESC');
		const articlesCount = await queryBuilder.getCount();
		//мы должны проверить или вообще переданы в url какой-то limit или offset
		if (query.limit) {
			queryBuilder.limit(query.limit);
		}
		if (query.offset) {
			queryBuilder.offset(query.offset);
		}
		const articles = await queryBuilder.getMany();
		return { articles, articlesCount };
	}

	async createArticle(
		currentUser: UserEntity,
		createArticleDto: CreateArticleDto,
	): Promise<ArticleEntity> {
		const article = new ArticleEntity();
		Object.assign(article, createArticleDto);
		if (!article.tagList) article.tagList = [];
		article.slug = this.getSlug(createArticleDto.title);
		article.author = currentUser;
		return this.articleRepository.save(article);
	}

	async findBySlug(slug: string): Promise<ArticleEntity> {
		const article = await this.articleRepository.findOne({
			where: { slug },
		});
		if (!article) throw new HttpException(`No article found with this slug`, HttpStatus.NOT_FOUND);
		return article;
	}

	async findBySlugAndDelete(currentUserId: number, slug: string): Promise<DeleteResult> {
		const article = await this.findBySlug(slug);
		if (!article) throw new HttpException(`No article found with this slug`, HttpStatus.NOT_FOUND);
		if (article.author.id !== currentUserId)
			throw new HttpException(
				`This User didn't create this article, no permission to delete`,
				HttpStatus.FORBIDDEN,
			);
		return await this.articleRepository.delete({ slug });
	}

	async updateArticleBySlug(
		currentUserId: number,
		slug: string,
		updateArticleDto: CreateArticleDto,
	): Promise<ArticleEntity> {
		const article = await this.findBySlug(slug);
		if (!article) throw new HttpException(`No article found with this slug`, HttpStatus.NOT_FOUND);
		if (article.author.id !== currentUserId)
			throw new HttpException(
				`This User didn't create this article, no permission to delete`,
				HttpStatus.FORBIDDEN,
			);
		Object.assign(article, updateArticleDto);
		return await this.articleRepository.save(article);
	}

	async addArticleToFavorites(slug: string, currentUserId: number): Promise<ArticleEntity> {
		const article = await this.findBySlug(slug);
		const user = await this.userRepository.findOne({
			where: { id: currentUserId },
			relations: ['favorites'],
		});
		//здесь мы узнаем или пост залайкан
		const isNotFavorite =
			user?.favorites.findIndex((articleInFavorites) => articleInFavorites.id === article.id) ===
			-1; //-1 означает что у нас в массиве нет такого элемента
		//этот if сделает так что пользователь не сможет лайкать один пост больше одного раза
		if (isNotFavorite) {
			//здесь мы залайкаем наш пост, эта одна строчка и дальше тайпорм делает всё за нас
			user?.favorites.push(article);
			article.favouritesCounts++;
			await this.userRepository.save(user);
			await this.articleRepository.save(article);
		}
		return article;
	}

	async deleteArticleFromFavorites(slug: string, currentUserId: number): Promise<ArticleEntity> {
		const article = await this.findBySlug(slug);
		const user = await this.userRepository.findOne({
			where: { id: currentUserId },
			relations: ['favorites'],
		});
		const articleIndex = user?.favorites.findIndex(
			(articleInFavorites) => articleInFavorites.id === article.id,
		);
		//проверка есть ли article, если индекс больше -1 то есть
		if (user && articleIndex && articleIndex >= 0) {
			//splice-мутабельный метод, мы сначала задаём индекс и сколько элементом удалить
			user.favorites.splice(articleIndex, 1);
			article.favouritesCounts--;
			await this.userRepository.save(user);
			await this.articleRepository.save(article);
		}

		return article; //если артикла нет то мы его просто возвращаем и ничего больше не делаем
	}

	buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
		return { article }; // { article: article }
	}

	private getSlug(title: string): string {
		return (
			slugify(title, {
				lower: true,
			}) +
			'-' +
			((Math.random() * Math.pow(36, 6)) | 0).toString(36)
		);
	}
}

/*
if (!article.tagList) article.tagList = []; //если юзер не указал тегЛист то нам нужно его создать, иначе получим ошибку бо в Постгресе это поле обязательно

article.author = currentUser; - Typeorm достаточно умный что бы понять что у нас связь между Артикел и Юзером по-этому он записит в author только id которое находится в currentUser

Чтобы сделать slug воспользуем специально либой slugify, но проблема в том что она просто превращает строку в slug но не делает её уникальной !
(Math.random() * Math.pow(36, 6) | 0).toString(36) так мы получим уникальный строку, это обычный алгоритм что бы получать уникальную строку

async findBySlug(slug: string): Promise<ArticleEntity> { обрати вниание что мы в Сервисе всегда возвращаем только СУЩНОСТЬ потому что это хорошая практика работать только с сущностями в сервисе

В findBySlugAndDelete мы получаем проблему что наш article в себе не содержит author, а автор нам нужен что бы проверить на наличие юзера который создал эту статью, если юзер и автор разные то выдать ошибку
Нам нужно зайти в ArticleEntity и передать третью опцию в автора { eager: true }

const queryBuilder = this.dataSource.getRepository(ArticleEntity); по факту мы пишем sql запросы для таблицы articles и создаём квериБилдер. Но проблема в том что эта запись на вернёт квериБилдер только для таблица Articles, а нам нужно каждому Article получить автора. До этого у нас было получение автора через { eager: true }, мы везде в наших методах могли использовать articleRepository.findOne и автоматически мы там получали дополнительно автора
Здесь же в КвериБилдере так работать не будет, потому что это очень нискоуровнево и нам нужно самим сказать что мы хотим здесь делать.
Наш автор находится в другой таблице и нам нужно использовать такую вещь с sql как left join, те мы джоиним нашу таблицу добавляя другую таблицу когда мы делаем выборку, те мы из article берём author.id и по нему добавляем запись из таблицы Юзеров:
const queryBuilder = this.dataSource
			.getRepository(ArticleEntity)
			.createQueryBuilder('articles')
			.leftJoinAndSelect('articles.author', 'author');
То-есть мы в leftJoinAndSelect указываем первое - что мы хотим выбрать, а второе алиас
Но для того что бы нам было удобней работать с queryBuilder мы укажем createQueryBuilder('articles'), тем самым мы явно указали какой алиас будет для нашей таблицы в Кверибилдере
'articles.author' - мы будем лефтджоинить
'author' - алиас

const article = await queryBuilder.getMany(); - гетМени вернёт нам массив articles из нашего запроса, по факту всё что мы сделали в queryBuilder нам строит запрос

queryBuilder.orderBy('articles.createdAt', 'DESC');; - позволяет отсортировать все наши записи, первым параметром по какому полю, вторым по возростаниюи или убыванию

?limit=20 говорит какой лимит айтемов мы отдаем
?offset=0 говорит что мы начинаем с самого начала, то-есть мы выводим от 0 до 20. Cледующий офсет уже будет от 20 до 40 и тд

queryBuilder.andWhere(); - andWhere мы можем применять в нескольких иф условиях а where только один раз
('articles.authorId = :id'); - это :id это место куда вставится наша переменная

`%${query.tag}%`, - знаки процентов нужны что бы явно указать что нам нужно искать НЕ точно, если слово внутри процентов будет, то нам этого уже достаточно

// ManyToMany
В addArticleToFavorites мы по дефолту получаем пользователя без отношений(без relations), мы в контроллере не прочитали пользователя, а только его айди, а нам нужно получать с relations, те user.favorites у него не будет

const user = await this.userRepository.findOne({
			where: { id: currentUserId },
			relations: ['favorites'],
});
Мы вторым аргументом добавляем опции, и мы там явно указываем relations - это то что по дефолту не делает, те в контроллере он без relations и там мы указываем массив с полем favorites

В БД напишем select * from users_favorites_article; таким образом мы првоерим а появилась ли у нас зависимость
ediumclone=# select * from users_favorites_articles;
 usersId | articlesId
---------+------------
       1 |          4
 */
