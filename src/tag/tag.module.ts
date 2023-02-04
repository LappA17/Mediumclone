import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagController } from './tag.controller';
import { TagEntity } from './tag.entity';
import { TagService } from './tag.service';

@Module({
	imports: [TypeOrmModule.forFeature([TagEntity])],
	controllers: [TagController],
	providers: [TagService],
})
export class TagModule {}

/*
  Repository - из-за того что мы используем Repository как зависимость в tag.service - нам нужно передать её здесь

  TypeOrmModule.forFeature() - поскольку каждый наш модель является фитчей и во внутрь forFeature([ мы передаём массив наших сущностей ]) 
*/
