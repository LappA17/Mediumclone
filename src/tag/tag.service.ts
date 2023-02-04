import { Injectable } from '@nestjs/common';
import { TagEntity } from '@app/tag/tag.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TagService {
	constructor(
		@InjectRepository(TagEntity) private readonly tagRepository: Repository<TagEntity>
	) {}
	async findAll(): Promise<TagEntity[]> {
		return await this.tagRepository.find();
	}
}

/*
	RepositoryRepository - мы импортируем Repository потому что это специальный паттерн, который использует typeorm

	@InjectRepository(TagEntity) - внутри круглых скобок в InjectRepository мы указываем какие данные вообще нам нужны

	@InjectRepository(TagEntity) private readonly tagRepository: Repository<TagEntity> - мы инжектим здесь репозиторий который сможет работать с нашим тегом, tagRepository - это наш ОРМ враппер, что бы работать конкретно с таблицей TagEntity

	this.tagRepository.find() - метод find вернёт нам абсолютно все записи в нашей таблице
*/
