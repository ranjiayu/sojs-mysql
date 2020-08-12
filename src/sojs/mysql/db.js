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
            acquireTimeout: 3600,
            waitForConnections: true,
            connectionLimit: 100,
            queueLimit: 0
        };
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
            pool: poolOptions,
            connection: connectionOptions
        };
        this.options = gOption;
    },
    db: function (options) {
        this.setOption(options);
        this.connection = this.mysql.createPool(
            Object.assign({}, this.options.pool, this.options.connection));
        // this.connection.on('release', function (c) {
        //     console.log('Connection %d released', c.threadId);
        // });
        // this.connection.on('enqueue', function () {
        //     console.log('Waiting for available connection slot')
        // });
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
        var pool = this.connection;
        return sojs.create('sojs.promise', function (resolve, reject) {
            pool.getConnection(function (err, conn) {
                if (err) throw new Error('get connection from pool failed.');
                // 在事务中, 保证每个query实例的connection对象是一个
                if (self.isArray(p)) {
                    for (var i = 0; i < p.length; i ++) {
                        if (self.isQuery(p[i])) {
                            p[i] = p[i].setConnection(conn);
                            statementList.push(p[i]);
                        } else {
                            throw new Error('transaction params must be a query or query array instance.');
                        }
                    }
                } else if (self.isQuery(p)) {
                    p = p.setConnection(conn);
                    statementList.push(p);
                } else {
                    throw new Error('transaction params must be a query, query array or Promise.');
                }
                var result = [];
                var connection = conn;
                // Commit动作
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
                // 事务开始
                connection.beginTransaction(function () {
                    if (sequential) {
                        statementList.push(commitPromise);
                        // execute these promise sequential!
                        var compelte = 0;
                        var count = statementList.length;
                        function iterate () {
                            // callback only run onece in this scope
                            var addCompelete = function (r) {
                                result.push(r);
                                compelte ++;
                                if (compelte < count) {
                                    iterate();
                                } else {
                                    resolve(result.slice(0, -1));
                                    connection.release();
                                }
                                return;
                            };
                            addCompelete = self.once(addCompelete);
                            if (statementList[compelte].execute) {
                                statementList[compelte].execute().
                                then(addCompelete)
                                .catch(function (err) {
                                    reject(err);
                                    connection.rollback(function (err) {
                                        connection.release();
                                    });
                                });
                            } else {
                                statementList[compelte]()
                                .then(addCompelete)
                                .catch(function (err) {
                                    reject(err);
                                    connection.rollback(function (err) {
                                        connection.release();
                                    });
                                });
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
                            connection.release();
                        }).catch(function (err) {
                            reject(err);
                            connection.rollback(function (err) {
                                connection.release();
                            });
                        });
                    }
                });
            });
        });
    },
    execute: function (sql, values) {
        var self = this;
        return sojs.create('sojs.promise', function (resolve, reject) {
            self.connection.query(sql, values, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);   
                }
            });
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