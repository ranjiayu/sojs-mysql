require('sojs');

var options = {
    poolOn: false,
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '123456',
        database: 'test',
        debug: true
    }
};
var DB = sojs.create('sojs.mysql.db', options);

// SELECT

// DB.table('user')
// .select(['name', 'id'])
// .where('name__like', '%rjy%')
// .where('age__gt', 10)
// .where('school', 'xd')
// .limit(5)
// .orderBy('age', 'desc')
// .get().execute()
// .then(function (res) {
//     console.log(res);
// })
// .catch(function (err) {
//     console.log(err);
// });

// INSERT

// DB.table('user').insert({name: 'ranjiayu2'}).execute()
// .then(function (res) {
//     console.log(res);
// })
// .catch(function (err) {
//     console.log(err);
// });

// UPDATE

// DB.table('user').where('name', 'ranjiayu2').update({name: 'ranjiayu3'}).execute()
// .then(function (res) {
//     console.log(res);
// })
// .catch(function (err) {
//     console.log(err);
// });

// DELETE
// DB.table('user').where('name__in', ['t5', 't6', 't7']).delete().execute()
// .then(function (res) {
//     console.log(res);
// })
// .catch(function (err) {
//     console.log(err);
// })

// TRANSACTION

var batchInsert = [];
batchInsert.push(DB.table('user').insert({name: 't5'}));
batchInsert.push(DB.table('user').where('name', 't5').delete());
batchInsert.push(DB.table('user').insert({name: 't6'}));

DB.transactions(batchInsert, true)
.then(function (res) {
    console.log(res);
}).catch(function (err) {
    console.log(err);
});