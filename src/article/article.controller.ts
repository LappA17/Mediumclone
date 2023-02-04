import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
	UsePipes,
} from '@nestjs/common';
import { ArticleService } from '@app/article/article.service';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { ArticleResponseInterface } from '@app/types/articleResponse.interface';
import { ArticlesResponseInterface } from '@app/types/articlesResponse.interface';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';

@Controller('articles')
export class ArticleController {
	constructor(private readonly articleService: ArticleService) {}

	@Get()
	async findAll(
		@User('id') currentUserId: number,
		@Query() query: any,
	): Promise<ArticlesResponseInterface> {
		return await this.articleService.findAll(currentUserId, query);
	}

	@Get(':slug')
	async getSingleArticle(@Param('slug') slug: string): Promise<ArticleResponseInterface> {
		const article = await this.articleService.findBySlug(slug);
		return this.articleService.buildArticleResponse(article);
	}

	//здесь мы будем получать всех пользователей, которых зафоловил наш текущий юзер
	@Get('feed')
	@UseGuards(AuthGuard)
	async getFeed(
		@User('id') currentUserId: number,
		@Query() query: any,
	): Promise<ArticlesResponseInterface> {
		return await this.articleService.getFeed(currentUserId, query);
	}

	@Post()
	@UseGuards(AuthGuard)
	@UsePipes(new BackendValidationPipe())
	async create(
		@User() currentUser: UserEntity,
		@Body('article') createArticleDto: CreateArticleDto,
	): Promise<ArticleResponseInterface> {
		const article = await this.articleService.createArticle(currentUser, createArticleDto);
		return this.articleService.buildArticleResponse(article);
	}

	@Post(':slug/favorite')
	@UseGuards(AuthGuard)
	async addArticleToFavorites(
		@User('id') currentUserId: number,
		@Param('slug') slug: string,
	): Promise<ArticleResponseInterface> {
		const article = await this.articleService.addArticleToFavorites(slug, currentUserId);
		return this.articleService.buildArticleResponse(article);
	}

	@Delete(':slug/favorite')
	@UseGuards(AuthGuard)
	async deleteArticleFromFavorites(
		@User('id') currentUserId: number,
		@Param('slug') slug: string,
	): Promise<ArticleResponseInterface> {
		const article = await this.articleService.deleteArticleFromFavorites(slug, currentUserId);
		return this.articleService.buildArticleResponse(article);
	}

	@Put(':slug')
	@UseGuards(AuthGuard)
	@UsePipes(new BackendValidationPipe())
	async updateArticle(
		@User('id') currentUserId: number,
		@Param('slug') slug: string,
		@Body('article') updateArticleDto: CreateArticleDto,
	): Promise<ArticleResponseInterface> {
		const article = await this.articleService.updateArticleBySlug(
			currentUserId,
			slug,
			updateArticleDto,
		);
		return this.articleService.buildArticleResponse(article);
	}

	@Delete(':slug')
	@UseGuards(AuthGuard)
	async deleteArticle(
		@User('id') currentUserId: number,
		@Param('slug') slug: string,
	): Promise<any> {
		return this.articleService.findBySlugAndDelete(currentUserId, slug);
	}
}

/*
@Post()
async create() {}
На запрос /articles у нас всегда будет вызываться create потому что мы в @Post() не передали ничего http://localhost:8000/article
Если бы мы передали в @Post('create') тогда бы http://localhost:8000/article/create

Так же нам нужно прочитать текущего пользователя, потому что именно эти данные нам нужно отдавать в наш Сервис - @User() currentUser: UserEntity
@Body('article') - получаем article из реквеста

Мы на это
{
    "article": {
        "title": "title",
        "description": "description",
        "body": "body",
        "tagList": "['reactJs', 'angularJs']"
    }
}
Получаем это
{
    "title": "title",
    "description": "description",
    "body": "body",
    "tagList": "['reactJs', 'angularJs']",
    "slug": "foo",
    "author": {
        "id": 1,
        "email": "jacob@gmail.com",
        "username": "Jacob",
        "bio": "Bio1",
        "image": "Image1"
    },
    "id": 2,
    "createdAt": "2022-10-30T14:43:55.589Z",
    "updateAt": "2022-10-30T14:43:55.589Z",
    "favouritesCounts": 0
}

@Param('slug') - мы получаем параметр из url

//
findAll:
@User('id') currentUserId может нам так же вернуть null, у нас нет проверки есть ли юзер
@Query('limit') - так мы указываем какие квери параметры нам нужны из урла
@Query() query: any - а так мы получили все кверипараметры в query

//
мы сейчас будем реализовывать лайканье постов. И нам нужно реализовать many to many потому что огромное количество людей могут залайкать пост и так же у одного человека может быть огромное кство залайканых постов, то-есть у поста может быть много пользователей которые его залайкали и у пользователя
*/
