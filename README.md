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
    // return sojs.promise instance, set false to return Promise instance.
    returnSojsPromise: true,
    // connection pool
    poolOn: false,
    // connection options, see more: node-mysql
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '123456',
        database: 'test'
    }
};

var DB = sojs.create('sojs.mysql.db', options);

DB.table('user').select(['name', 'id']).where('name', 'rjy').get()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});

DB.table('user').select('name').where('create_time', new Date()).get()
.then(function (res) {
    console.log(res);
})
.catch(function (err) {
    console.log(err);
});
```

## API

Methods:

### Classes

DB (sojs.mysql.db)

Query (sojs.mysql.query)

### Methods

* DB::setOptions(options) reset configuration.
* DB::table(tableName) return a query instance.
* Query.select(array|string)
* Query.where(string, string)





## TODO

* Transaction