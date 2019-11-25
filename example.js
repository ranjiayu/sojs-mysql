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


// DB.table('user').select('name').where('id__in', [1, 2, 3, 4]).get();
// DB.table('user').select().where('create_time__range', [new Date(), new Date()]).get();
// DB.table('user').select('*').where('name__like', '%rjy').get();
// DB.table('user').where('age__lte', 23).get();

// DB.table('user').select('name').limit(5).get();
// DB.table('user').where('age__gt', 20).orderBy('age', 'desc').get();
// DB.table('user').select('name').groupBy('age').get();

// DB.table('user').join('user_info', 'user.id', 'user_info.uid').get();
// DB.table('user').join('user_info', 'user.id', 'user_info.uid', 'LEFT').get();
