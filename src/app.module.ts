import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TagModule } from './tag/tag.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import ormconfig from './ormconfig';
import { AuthMiddleware } from './user/middlewares/auth.middleware';
import { ArticleModule } from './article/article.module';
import { ProfileModule } from './profile/profile.module';

@Module({
	imports: [TypeOrmModule.forRoot(ormconfig), TagModule, UserModule, ArticleModule, ProfileModule],
	controllers: [],
	providers: [],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes({
			path: '*',
			method: RequestMethod.ALL,
		});
	}
}

/*
	Так как AuthMiddleware будет глобальным(сможем покрыть им все запросы) мидлвеером, то нам нужно его заинжектить прям в AppModule
	path: '*', - говорит что мы хотим применить их на все роуты
	ТО-ЕСТЬ НАМ НЕ НУЖНО БУДЕТ ВВИДЕ ДЕКОРАТОРЫ НАВЕШИВАТЬ НАД ЗАПРОСАМИ НАШ МИДЛВЕЕР, А ОН САМ БУДЕТ РАБОТАТЬ АВТОМАТИЧЕСКИ !

	Когда нам нужно применить миддлвеер мы обычно пишем ее внутри AppModule и там пишем consumer.apply
*/
