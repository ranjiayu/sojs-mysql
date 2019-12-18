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
            connection: connectionOptions
        };
        this.options = gOption;
    },
    db: function (options) {
        this.setOption(options);
    },
    connect: function (dbName) {
        if (this._inTransaction) {
            if (this.connection) {
                return this.connection;
            }
        }
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
            // Transaction use the same Connection instance.
            connection = this.mysql.createConnection(this.options.connection);
            connection.connect();
            this.connection = connection;
            return connection;
        }
    },
    table: function (tableName) {
        return this.query().from(tableName);
    },
    query: function () {
        return sojs.create('sojs.mysql.query', this);
    },
    transactions: function (p, sequential) {
        sequential = sequential || false;
        var self = this;
        var statementList = [];
        var connection = this.connect();
        var commitPromise = function (result) {
            return sojs.create('sojs.promise', function (resolve, reject) {
                connection.commit(function (err) {
                    if (err) {
                        reject(false);
                    }
                    resolve(result);
                });
            });
        };
        if (this.isArray(p)) {
            // query list
            for (var i = 0; i < p.length; i ++) {
                if (this.isQuery(p[i])) {
                    p[i] = p[i].setConnection(self);
                    statementList.push(p[i]);
                } else {
                    throw new Error('transaction params must be a query or query array instance.');
                }
            }
        } else if (this.isQuery(p)) {
            // query instance
            p = p.setConnection(self);
            statementList.push(p);
        } else {
            throw new Error('transaction params must be a query, query array or Promise.');
        }
        return sojs.create('sojs.promise', function (resolve, reject) {
            connection.beginTransaction(function () {
                if (sequential) {
                    // var _p = function () {
                    //     return sojs.create('sojs.promise', function (r, v) {
                    //         r(true);
                    //     });
                    // };
                    // statementList.unshift(_p);
                    statementList.push(commitPromise);
                    // execute these promise sequential!
                    var compelte = 0;
                    var count = statementList.length;
                    var iterate = function () {
                        if (statementList[compelte].execute) {
                            statementList[compelte].execute().then(self.once(function () {
                                compelte ++;
                                if (compelte < count) {
                                    iterate();
                                }
                            }))
                        } else {
                            statementList[compelte]().then(self.once(function () {
                                compelte ++;
                                if (compelte < count) {
                                    iterate();
                                }
                            }));
                        }
                    };
                    iterate();
                } else {
                    for (var i = 0; i < statementList.length; i ++) {
                        statementList[i] = statementList[i].execute();
                    }
                    sojs.promise.all(statementList)
                    .then(commitPromise)
                    .then(function (result) {
                        resolve(result);
                        connection.end();
                    }).catch(function (err) {
                        reject(err);
                        connection.rollback(function (err) {
                            connection.end();
                        });
                    });
                }
            });
        });
    },
    execute: function (sql, values) {
        var self = this;
        var connection = self.connect();
        if (this.options.connection.debug) {
            console.log('execute sql : ' + sql);
            console.log('binding values : ' + values);
        }
        return sojs.create('sojs.promise', function (resolve, reject) {
            connection.query(sql, values, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);   
                }
            });
            if (!self.options.poolOn && !self._inTransaction) {
                connection.end();
            }
        });

    },
    getType: function (o) {
        return Object.prototype.toString.call(o);
    },
    isArray: function (o) {
        return this.getType(o) === '[object Array]';
    },
    isQuery: function (o) {
        return o.__proto__ && o.__proto__.__full === 'sojs.mysql.query';
    },
    isPromise: function () {
        return o.__proto__ && o.__proto__.__full === 'sojs.promise';
    },
    once: function (fn) {
        var self = this;
        var called = false;
        return function () {
            if (!called) {
                called = true;
                fn.apply(self, arguments);
            }
        };
    }
});