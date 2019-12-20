# sojs-mysql
A simple mysql database utility base on [sojs](https://github.com/zhangziqiu/sojs)

## Install

```bash
npm install sojs-mysql
```

## Usage

```javascript
require('sojs');

var options = {
    poolOn: false,
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '123456',
        database: 'test'
    }
};
var DB = sojs.create('sojs.mysql.db', options);

// SELECT

DB.table('user')
.select(['name', 'id'])
.where('name__like', '%rjy%')
.where('age__gt', 10)
.where('school', 'xd')
.limit(5)
.orderBy('age', 'desc')
.get().execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

// INSERT

DB.table('user').insert({name: 'ranjiayu1'}).execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

// UPDATE

DB.table('user').where('name', 'rjy').update({name: 'rjy1'}).execute()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

// TRANSACTION
var batchInsert = [];
batchInsert.push(DB.table('user').insert({name: 't5'}));
batchInsert.push(DB.table('user').insert({name: 't6'}));
batchInsert.push(DB.table('user').insert({id: 1, name: 't7'}));

DB.transactions(batchInsert)
.then(function (res) {
    console.log(res);
    // res is an array, include all statements' results.
}).catch(function (err) {
    console.log(err);
});
```

## Document

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

