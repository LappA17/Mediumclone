import { ArgumentMetadata, HttpException, HttpStatus, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export class BackendValidationPipe implements PipeTransform {
	async transform(value: any, metadata: ArgumentMetadata) {
		if (metadata.metatype) {
			const object = plainToClass(metadata.metatype, value);
			if (typeof object !== 'object') return value;
			const errors = await validate(object);
			if (errors.length === 0) {
				//если ошибок нет то мы просто возвращаем value и ничего не делаем
				return value;
			}
			throw new HttpException(
				{ errors: this.formatError(errors) },
				HttpStatus.UNPROCESSABLE_ENTITY,
			);
		} else {
			throw new Error(`Metadata is undefined`);
		}
	}

	formatError(errors: ValidationError[]) {
		return errors.reduce((accum: any, err: any) => {
			if (err.constraints) {
				accum[err.property] = Object.values(err.constraints);
				return accum;
			}
		}, {});
	}
}

/*
plainToClass - это специальный метод который конвертиурет value, metadata в необходимый нам формат
потом этот object что мы получили - мы будем валидировать

err.constrains - это у нас объект и нас интересует 'title should not be empty', то-есть:
ValidationError {
	property: 'title',
	constraints: { isNotEmpty: 'title should not be empty' }
}
Object.values(err.constrains) - вернёт нам именно массив строк
acc[error.property] - здесь мы сетим еррор-проперти
 */
