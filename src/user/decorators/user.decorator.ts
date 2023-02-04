import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: any, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	if (!request.user) return null;
	if (data) return request.user[data]; //получаем только айди пользователя потому что мы в декоратор параметром его передаём
	return request.user;
});

/*
    Если мы напишем ctx.switchToHttp(). то мы сможем получить данные с любой части нашего запроса(реквест, респонс или некст)

    Наш мидлвеер отрабатывает до Декоратора

    Если мы в декоратор передадим к примеру id то-есть @User('id'), то эта строка id и будет то что мы получаем внутри data
    по-этому мы добавим условие что если у нас указанна data то мы вернём определенные часть юзера

    Декораторы - это просто сахар, то-есть мы могли бы спокойно написать этот код в контроллере, но мы не хотим дублировать этот код постоянно
*/
