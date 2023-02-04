import { UserResponseInterface } from '@app/types/userResponse.interface';
import {
	Body,
	Controller,
	Get,
	Post,
	Put,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { LoginUserDto } from './dto/login.dto';
import { UserService } from './user.service';
import { User } from './decorators/user.decorator';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post('users')
	@UsePipes(new BackendValidationPipe())
	async createUser(@Body('user') createUserDto: CreateUserDto): Promise<UserResponseInterface> {
		const user = await this.userService.createUser(createUserDto);
		if (!user) throw new Error('There is no user');
		return this.userService.buildUserResponse(user);
	}

	@Post('login')
	@UsePipes(new BackendValidationPipe())
	async loginUser(@Body('user') loginUserDto: LoginUserDto): Promise<UserResponseInterface> {
		const user = await this.userService.login(loginUserDto);
		return this.userService.buildUserResponse(user);
	}

	@Get('user')
	@UseGuards(AuthGuard)
	async currentUser(@User() user: UserEntity): Promise<UserResponseInterface> {
		if (!user) throw new Error(`User not found`);
		return this.userService.buildUserResponse(user);
	}

	@Put('user')
	@UseGuards(AuthGuard)
	async updateCurrentUser(
		@User('id') currentUserId: number,
		@Body('user') updateUserDto: UpdateUserDto,
	): Promise<UserResponseInterface> {
		const user = await this.userService.updateUser(currentUserId, updateUserDto);
		return this.userService.buildUserResponse(user);
	}
}

/*
    Нам нужно создать дто для регистрации
    Мы можем из нашего зарпоса в любой момнет прочитать body с помощью декоратора @Body()
    Представим что нам приходят такие данные:
        "user": {
            "username": "Jacob",
            "email": "jacob@gmail.com",
            "password": "jacob123"
        }
    И нам нужно из этого реквестбоди прочитать конкретно user
    и мы явно укажем в декораторе @Body('user')

    const newUser = new UserEntity() - так мы получаем новую сущность, но теперь newUser - это просто пустой объект, нам нужно все поля newUser перезаписать в createUserDto, для этого нам нужно мутировать данные, а не создавать новый Объект, потому что newUser должен остаться без изменений
    Object.assign(newUser, createUserDto); - так мы перезаписываем все поля или добавляем новые из createUserDto в newUser

	console.log(request.user); - если мы пропишем сonsole.log в console.log(request.user); то мы получим полную сущность нашего юзера
	UserEntity {
		id: 1,
		email: 'jacob@gmail.com',
		username: 'Jacob',
		bio: '',
		image: ''
	}

	мы из currentUser удалем @Req() request: ExpressRequest, потому что мы уже получили юзера

	@UseGuards(AuthGuard) - защищает наш запрос и говорит что это только для авторизованных пользователей

	Middlevare(парсим наш токен и получаем текущего пользователя) -> Guard(проверяет залогинины мы или нет) -> Контроллер

	updateCurrentUser - мы в этом методе должны получить текущего юзера с помощью Декоратора @User() user: UserEntity, то-есть тот юзер которого мы создали ранее
	А так же мы достаём с body с помощью декоратора @Body('user')
	"user": {
            "username": "Jacob",
            "email": "jacob@gmail.com",
            "password": "jacob123"
        }
  То-есть здесь мы получаем обновленного юзера
  @Body('user') updatedUserDto: UpdateUserDto, - то-есть это грубоговоря те новые данные которые нам приходят в запросе

  @User('id') currentUserId: number, мы можем передавать сюда либо юзера по айди
  @User() user: UserEntity либо целого юзера

*/
