import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'follows' })
export class FollowEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	followerId: number;

	//тот кого фолловят
	@Column()
	followingId: number;
}
