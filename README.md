# sojs-mysql
A simple mysql database utility base on [sojs](https://github.com/zhangziqiu/sojs)

基于[sojs](https://github.com/zhangziqiu/sojs)的mysql工具库, 更方便可读地生成SQL语句, 减少手动拼接SQL的成本

## Install 安装

```bash
npm install sojs-mysql
```

## Document 文档

DB.table(tableName) 返回的是一个Query实例, Query实例的大部分方法(不包括execute)都返回自身实例(this)

execute方法返回一个Promise(sojs.promise)

具体看以下例子

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

// WHERE, 借鉴Django ORM的语法, 列名 + __like, __lte, __lt, __gt, __gte, __range, __in, __eq, __neq, __isnull 作为第一个参数, 第二个参数为值

queryInstance.where('column__like', 'abc') // column like 'abc'
queryInstance.where('column0', 1).orWhere('column1', 2) // column = 1 or column1 = 2
queryInstance.notWhere('column', 'xyz') // column != 'xyz'

// where组使用回调函数来嵌套条件，一个回调函数相当于给这些条件加上 (  )

console.log(queryInstance
.table('user')
.select(['name'])
.where('a', 1)
.where(function (q) {
    q.where('b', 2);
    q.orWhere('c', 3);
    q.where(function (q1) {
        q1.where('e', 5);
        q1.where('f', 6);
    })
})
.where('d', 4)
.statement);

// 生成语句：SELECT `name` FROM user  WHERE `a` = 1 AND (`b` = 2 OR `c` = 3 AND (`e` = 5 AND `f` = 6)) AND `d` = 4

// ORDER BY

queryInstance.orderBy('column', 'asc');
queryInstance.orderBy(['column1', 'asc'], ['column2', 'desc']);

// LIMIT, 注意limit要在order by之后写

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

// 先实例多个Query实例
var batchInsert = [];
batchInsert.push(DB.table('user').insert({name: 't5'}));
batchInsert.push(DB.table('user').where('name', 't5').delete());
batchInsert.push(DB.table('user').insert({name: 't6'}));

// 执行, 第二个参数false表示不是顺序执行, true表示顺序执行
DB.transactions(batchInsert, false)
.then(function (res) {
    console.log(res);
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