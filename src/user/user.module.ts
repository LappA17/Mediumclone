import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity])],
	controllers: [UserController],
	providers: [UserService, AuthGuard],
	exports: [UserService],
})
export class UserModule {}

/*	У нас проблема что наш UserService - недоступен в AuthMiddleware
	providers: [UserService], - так как мы только поместили UserService в провайдер то он у нас вообще недоступен снаружи
	по-этому поместим его в exports

	Нужно всегда регистрировать Гварды
*/
