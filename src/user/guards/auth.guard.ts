import {
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExpressRequest } from '@app/types/expressRequest.interface';

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest<ExpressRequest>();
		if (!request.user) throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
		return true;
	}
}

/*
Разница между Guard и Middlevare в том что мидлвеер - может всё, это нискоуровнивая вещь, которая получает доступ ко всему и мы можем делать с Реквестом всё что нам пожелается
Guard же проверяет есть ли у нас доступ к текущему Роуту или нет

  Если AuthGuard возвращает true то мы можем попасть в наш Контроллер

	Теперь я получаю ошибку если введу неправильный token
 */
