sojs.define({
    name: 'db',
    namespace: 'sojs.mysql',
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
            poolOn: options.poolOn || false,
            pool: poolOptions,
            connection: connectionOptions,
            // if set to false, every query return (new Promise)
            returnSojsPromise: true
        };
        this.options = gOption;
    },
    db: function (options) {
        this.setOption(options);
    },
    connect: function (dbName) {
        var connection;
        dbName = dbName || this.options.connection.database;
        this.options.connection['database'] = dbName;
        if (this.options.poolOn === true) {
            // if use connection pool, return the Pool instance.
            if (this.connection != undefined) {
                return this.connection;
            }
            var pool = this.mysql.createPool(
                Object.assign({}, this.options.pool, this.options.connection));
            pool.on('release', function (c) {
                console.log('Connection %d released', c.threadId);
            });
            pool.on('enqueue', function () {
                console.log('Waiting for available connection slot')
            });
            this.connection = pool;
            return pool;
        } else {
            // every query need a new Connection instance.
            connection = this.mysql.createConnection(this.options.connection);
            return connection;
        }
    },
    table: function (tableName) {
        return this.query().from(tableName);
    },
    query: function () {
        return sojs.create('sojs.mysql.query', this);
    },
    execute: function (sql, values) {
        var self = this;
        var connection = self.connect();
        if (this.options.connection.debug) {
            console.log('execute sql : ' + sql);
            console.log('binding values : ' + values);
        }
        function queryCallback(resolve, reject) {
            connection.query(sql, values, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);   
                }
            });
            if (!self.options.poolOn) {
                connection.end();
            }
        }
        if (self.options.returnSojsPromise) {
            return sojs.create('sojs.promise', queryCallback.proxy(self));
        }
        return new Promise(queryCallback);
    }
});