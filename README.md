# sojs-mysql
A simple mysql database utility base on [sojs](https://github.com/zhangziqiu/sojs)

基于[sojs](https://github.com/zhangziqiu/sojs)的mysql工具库, 更方便可读地生成SQL语句

## Install 安装

```bash
npm install sojs-mysql
```

## Usage 基本使用

```javascript
require('sojs');

var options = {
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '123456',
        database: 'test'
    }
};
var DB = sojs.create('sojs.mysql.db', options);

// SELECT例子
// select('string')用于更方便地使用sum(),count()等函数
// 或者 select(['字段1', '字段2']), 默认为*

DB.table('user')
// .select(['name', 'id'])
// .select('count(name)')
.select(['name', 'count(*)'])
.where('name__like', '%rjy%')
.where('age__gt', 10)
.where('school', 'xd')
.orWhere('sex', 'man')
.orderBy('age', 'desc')
.limit(5)
.get().execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

// WHERE, 借鉴Django ORM的语法, __like, __lte, __lt, __gt, __gte, __range, __in, __eq, __neq, __isnull

queryInstance.where('column__like', 'abc') // column like 'abc'
queryInstance.where('column0', 1).orWhere('column1', 2) // column = 1 or column1 = 2
queryInstance.notWhere('column', 'xyz') // column != 'xyz'

// ORDER BY

queryInstance.orderBy('column', 'asc');
queryInstance.orderBy(['column1', 'asc'], ['column2', 'desc']);

// LIMIT

queryInstance.limit(offset, num);
queryInstance.limit(num);

// JOIN

queryInstance.join('table1', 'table0.id', 'table1.t_id', 'INNER') // inner join on table0.id = table1.t_id

// GROUP BY && HAVING

queryInstance.groupBy('column').having('column', '>', 5) // group by column having column > 5


// INSERT

DB.table('user').insert({name: 'ranjiayu2'}).execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

// UPDATE

DB.table('user').where('name', 'ranjiayu2').update({name: 'ranjiayu3'}).execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

// DELETE
DB.table('user').where('name__in', ['t5', 't6', 't7']).delete().execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
})

// TRANSACTION 事务

var batchInsert = [];
batchInsert.push(DB.table('user').insert({name: 't5'}));
batchInsert.push(DB.table('user').where('name', 't5').delete());
batchInsert.push(DB.table('user').insert({name: 't6'}));

DB.transactions(batchInsert, false)
.then(function (res) {
    console.log(res);
    // res is an array, include all statements' results.
}).catch(function (err) {
    console.log(err);
});

// EXECUTE 方法, 之前的.get(), .insert() 等方法, 都是构造出一个SQL, 返回的是this(query实例自身)
// 而 execute() 方法是真正地执行该语句, 并返回Promise对象(sojs.promise)

// 推荐使用 Async Await 语法

async function getResult () {
    let result = await DB.table('user')
    .select(['age', 'count(*)'])
    .groupBy('age')
    .get().execute();
    console.log(result);
}

```

## Document 文档

DB.table(tableName) return a Query instance

Query instance's majority of methods return itself, except *execute()* method.

Query Instance has execute() method, which return a promise.

eg. 
```javascript
DB.table('user').select().get() // Query instance
DB.table('user').where('name', 'ranjiayu').where('age', 16).delete() // Query instance
DB.table('user').select().get().execute() // Promise
DB.table('user').insert({name: 'rjy'}).execute() // Promise
```

Transaction usage:

```javascript
var queryInstances = [
    DB.table('user').insert({name: 'rjy'}),
    DB.table('user').insert({name: 'rjy1'})
];
DB.transaction(queryInstances, false); // params two means execute NOT senquential. Set true to execute sql in order. Default is false.
```

