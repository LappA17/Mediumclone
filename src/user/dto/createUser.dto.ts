import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
	@IsNotEmpty()
	@IsString()
	readonly username: string;

	@IsEmail()
	@IsNotEmpty()
	@IsString()
	readonly email: string;

	@IsNotEmpty()
	@IsString()
	readonly password: string;
}

/*
	@UsePipes(new ValidationPipe()) - если мы в контроллере над методом не напишем эту строчку то у нас не будет никакой валидации !
*/
