import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'tags'})
export class TagEntity {

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string
}

/*
* @Entity({ name: 'tags'}) - это значит что typeorm нам явно создаст таблицу tags в множественном числе
* Саша сказал что он привык называть все свои Ентитис в множественномм числе
*
* Мы в psql написали INSERT INTO tags (name) VALUES ('dragons');
* То-есть мы написали внутри первых () все колонки в которые мы хотим вставить данные
* В нашем случае это только name потому что id будет генерироваться автоматический
* а в VALUES ("dragons") мы пишем название которые мы хотим применить к name
* C большой буквы пишем потому что так читабельней, можно и с маленькой
* INSERT INTO tags (name) VALUES ("dragons"); - мы получаем ошибку потому что мы можем использовать двойные ковычки только для колонок, а не для значеней, если мы хотим написать строку то только одинарные ковычки
* */