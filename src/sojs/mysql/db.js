sojs.define({
    deps: {
        mysql: require('mysql')
    },
    connection: function (options) {
        var options = options || {};
        // promise 类型设置, 连接池设置, DB信息
    },
    table: function (tableName) {
        return this.query().from(tableName);
    },
    query: function () {
        return sojs.create('sojs.mysql.query', this);
    },
    execute: function (sql, values) {
        // use this.connection
        console.log('execute sql : ' + sql);
        console.log('binding values : ' + values);
    }
});