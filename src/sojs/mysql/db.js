sojs.define({
    deps: {
        mysql: require('mysql')
    },
    options: {},
    setOption: function (options) {
        // See: https://github.com/mysqljs/mysql#pooling-connections
        var defaultPoolOptions = {
            acquireTimeout: 10000,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
        // See: https://github.com/mysqljs/mysql#connection-options
        var defaultConnectionOptions = {
            charset: 'UTF8_GENERAL_CI',
            timezone: 'local',
            connectTimeout: 10000,
            stringifyObjects: false,
            debug: false,
        };
        var poolOptions = Object.assign({}, defaultPoolOptions, options.pool);
        var connectionOptions = Object.assign(
            {}, defaultConnectionOptions, options.connection);
        var gOption = {
            poolOn: false,
            pool: poolOptions,
            connection: connectionOptions
        };
        this.options = gOption;
    },
    $db: function (options) {
        this.setOption(options);
    },
    connect: function (dbName) {
        this.connection = null;
        this.options.connectionOptions['database'] = dbName;
        if (this.options.poolOn === true) {
            var pool = this.mysql.createPool(
                Object.assign({}, this.options.pool, this.options.connection));
            pool.on('release', function (c) {
                console.log('Connection %d released', c.threadId);
            });
            pool.on('enqueue', function () {
                console.log('Waiting for available connection slot')
            });
            this.connection = pool;
        } else {
            this.connection = this.mysql.createConnection(this.options.connection);
        }
    },
    close: function () {
        this.connection.end();
    },
    table: function (tableName) {
        return this.query().from(tableName);
    },
    query: function () {
        return sojs.create('sojs.mysql.query', this);
    },
    execute: function (sql, values) {
        // use this.connection
        this.connection.connect();
        // pool.query = pool.getConnection() -> connection.query()
        // -> connection.release()
        console.log('execute sql : ' + sql);
        console.log('binding values : ' + values);
        this.close();
    }
});