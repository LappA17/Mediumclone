import { JWT_SECRET } from '@app/config';
import { Decode } from '@app/types/decode.interface';
import { ExpressRequest } from '@app/types/expressRequest.interface';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { UserService } from '../user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(private readonly userService: UserService) {}

	async use(req: ExpressRequest, _: Response, next: NextFunction) {
		// если у нас нет хедера мы сразу понимаем что user = null
		if (!req.headers.authorization) {
			req.user = null;
			next();
			return;
		}

		const token = req.headers.authorization.split(' ')[1];

		try {
			const decode: string | Decode = verify(token, JWT_SECRET);
			if (typeof decode !== 'string' && decode.id) {
				const user = await this.userService.findById(decode.id);
				req.user = user;
				next();
			}
		} catch (err) {
			//если токен невалидный
			req.user = null;
			next();
		}
	}
}

/*
    Мидлвеер - это по сути то место куда код попадает ДО выполнения Контроллера

    req: Request - по-дефолту у Реквеста нет поля user, по-этому в Тайпсах нам нужно досоздать типы !!!

    verify - проверит наш токен и если он будет невалидным мы получим ошибку по-этому обернём в try catch
    verify(token, JWT_SECRET) - для верификации токена тоже нужен секрет и этот секрет не известен на клиенте

	decode - находится { id: 1, username: 'Jacob', email: 'jacob@gmail.com', iat: 1666883042 }
*/
