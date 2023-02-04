import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProfileType } from '@app/types/profile.type';
import { ProfileResponseInterface } from '@app/types/profileResponse.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/user.entity';
import { Repository } from 'typeorm';
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ProfileService {
	constructor(
		@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>,
	) {}

	async getProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
		const user = await this.userRepository.findOne({
			where: { username: profileUsername },
		});
		if (!user)
			throw new HttpException(`Profile ${profileUsername} doesn't exist`, HttpStatus.NOT_FOUND);
		const follow = await this.followRepository.findOne({
			where: {
				followerId: currentUserId,
				followingId: user.id,
			},
		});
		// Boolean(follow) - если follow будет найден то вернёт true, потому что сам follow у нас типа followEntity
		return { ...user, following: Boolean(follow) };
	}

	async followProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
		const user = await this.userRepository.findOne({
			where: { username: profileUsername },
		});
		if (!user)
			throw new HttpException(`Profile ${profileUsername} doesn't exist`, HttpStatus.NOT_FOUND);
		//сделаем проверку что текущий user не пожем себя фоловить
		if (currentUserId === user.id)
			throw new HttpException(`Follower and following can't be equal`, HttpStatus.BAD_REQUEST);
		const follow = await this.followRepository.findOne({
			where: {
				followerId: currentUserId,
				followingId: user.id, //тот профиль который мы хотим зафоловить
			},
		});
		if (!follow) {
			const followToCreate = new FollowEntity();
			followToCreate.followerId = currentUserId;
			followToCreate.followingId = user.id;
			await this.followRepository.save(followToCreate);
		}
		return { ...user, following: true };
	}

	async unfollowProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
		const user = await this.userRepository.findOne({
			where: { username: profileUsername },
		});
		if (!user)
			throw new HttpException(`Profile ${profileUsername} doesn't exist`, HttpStatus.NOT_FOUND);
		if (currentUserId === user.id)
			throw new HttpException(`We can't unfollow from ourself`, HttpStatus.BAD_REQUEST);
		//мы можем сразу удалить нашу запись из таблицу, если такая была. Нам не нужно делать доп проверку на есть ли такая запись, орм сама проверит
		await this.followRepository.delete({
			followerId: currentUserId,
			followingId: user.id,
		});
		return { ...user, following: false };
	}

	buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
		// @ts-ignore
		delete profile.email; //мы удаляем email, потому что это приватне поле которое лучше не отправлять ни клиент
		return {
			profile,
		};
	}
}
