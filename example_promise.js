require('sojs');

var options = {
    poolOn: false,
    connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '123456',
        database: 'test',
        debug: false
    }
};
var DB = sojs.create('sojs.mysql.db', options);

async function multiSelect() {
    let result = await DB.table('user').select(['name']).where('name', '123')
    .get().execute();

    console.log(result);

    let result1 = await DB.table('user').where('name__like', 'ran%yu')
    .get().execute();

    console.log(result1);
}

multiSelect();