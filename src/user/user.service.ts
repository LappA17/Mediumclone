import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/createUser.dto';
import { UserEntity } from './user.entity';
import { sign } from 'jsonwebtoken';
import { JWT_SECRET } from '@app/config';
import { UserResponseInterface } from '@app/types/userResponse.interface';
import { compare } from 'bcrypt';
import { LoginUserDto } from './dto/login.dto';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { IErrorResponse } from '@app/types/errorResponse.interface';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
	) {}

	async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
		//нам нужно правильно обработать ошибки, так как на Фронт они попадать просто так не будут
		const errorResponse: IErrorResponse = {
			errors: {},
		};
		const userByEmail = await this.userRepository.findOne({
			where: { email: createUserDto.email },
		});
		const userByUsername = await this.userRepository.findOne({
			where: { username: createUserDto.username },
		});
		//мы ошибки пушим в Объект, а не делаем throw, потом этот Объект можно выслать на Фронт с ошибками !
		if (userByEmail) {
			errorResponse.errors['email'] = 'has already exist';
		}
		if (userByUsername) {
			errorResponse.errors['username'] = 'has already exist';
		}
		if (userByEmail || userByUsername)
			throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
		const newUser = new UserEntity();
		Object.assign(newUser, createUserDto);
		return await this.userRepository.save(newUser);
	}

	async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
		const errorResponse: IErrorResponse = {
			errors: {
				'email or password': 'is invalid',
			},
		};
		const user = await this.userRepository.findOne({
			where: { email: loginUserDto.email },
			select: ['id', 'username', 'email', 'bio', 'image', 'password'],
		});
		if (!user) throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
		const isPasswordCorrect = await compare(loginUserDto.password, user.password); //первый пароль который незахеширован, второй из бд
		if (!isPasswordCorrect) throw new HttpException(errorResponse, HttpStatus.UNPROCESSABLE_ENTITY);
		return user;
	}

	async findById(id: number): Promise<UserEntity | null> {
		const user = this.userRepository.findOne({ where: { id } });
		if (user === null)
			throw new HttpException('User not found by id', HttpStatus.UNPROCESSABLE_ENTITY);
		return user;
	}

	async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
		const user = await this.findById(userId);
		if (!user) throw new HttpException('User not found in Login', HttpStatus.UNPROCESSABLE_ENTITY);
		Object.assign(user, updateUserDto);
		return await this.userRepository.save(user);
	}

	generateJwt({ id, username, email }: UserEntity): string {
		return sign(
			{
				id: id,
				username,
				email,
			},
			JWT_SECRET,
		);
	}

	buildUserResponse(user: UserEntity): UserResponseInterface {
		return {
			user: {
				...user,
				token: this.generateJwt(user),
			},
		};
	}
}

/*
	buildUserResponse - так как нам не нужно передавать JWT токен в базу данных, нам нужно ТОЛЬКО передать этот jwt на КЛИЕНТ и этот метод будет это делать

	sign - вторым параметром в эту фцию мы передаём секретный ключ, который должен знать ТОЛЬКО наш БЕ

	@Column({ select: false }) - из-за того что мы в userEntity сказали что пароль нигде не должен использоваться, то теперь в методе login вот здесь
	const user = await await this.userRepository.findOne({
			where: { email: loginUserDto.email },
		});
	при создание юзера мы не получим у него поле password
	в typeorm еще это не пофиксиили что мы можем явно указать какое поле нам нужно по-этому нужно передать все поля select: ['id', 'username', 'email', 'bio', 'image', 'password'] и тут передать password

	Object.assign(user, updatedUser); - таким образом мы МЕРДЖИМ ДАННЫЕ !!!
	То-есть обновляем старый объект(user) с новыми данными в updatedUser
	Те поля которые одинаковы и в user и в updatedUser остануться нетронутыми, а новые или перезаписанные - обновлятся

	return await this.userRepository.save(user); - метод save и сохраняет пользователя, а если такой уже есть то просто обновит его данные
*/
