sojs.define({
    name: 'query',
    namespace: 'sojs.mysql',
    deps: {
        sqlstring: require('sqlstring')
    },
    tableName: null,
    fields: [],
    conditions: null,
    joins: [],
    others: [],
    statement: '',
    // Public methods
    query: function (connection) {
        this.connection = connection;
        this.conditions = sojs.create('sojs.mysql.whereGroup');
    },
    from: function (tableName) {
        this.tableName = tableName;
        return this;
    },
    select: function (columns) {
        if (this.getType(columns) === '[object Array]') {
            var c = [];
            for (var i = 0; i < columns.length; i ++) {
                if (/\w+\(\S+\)/.test(columns[i])) {
                    // 函数名不作处理
                    c.push(columns[i]);
                } else {
                    c.push(this.escapeField(columns[i]));
                }
            }
            this.fields = c;
        } else if (this.getType(columns) === '[object String]') {
            this.fields = [columns];
        }
        return this;
    },
    where: function (field, value) {
        this.conditions.where(field, value);
        return this;
    },
    orWhere: function (field, value) {
        value = value || '';
        this.conditions.orWhere(field, value);
        return this;
    },
    notWhere: function (field, value) {
        this.conditions.notWhere(field, value);
        return this;
    },
    join: function (table, baseKey, joinKey, prefix) {
        baseKey = baseKey || 'id';
        joinKey = joinKey || 'id';
        prefix = prefix || 'INNER';
        this.joins.push({
            table: table,
            baseKey: baseKey,
            joinKey: joinKey,
            prefix: prefix
        });
        return this;
    },
    limit: function (n, m) {
        n = parseInt(n, 10);
        if (isNaN(n)) {
            throw new Exception('limit params must be integer.');
        }
        if (m != undefined && n != undefined) {
            m = parseInt(m, 10);
            if (isNaN(m)) {
                throw new Exception('limit params must be integer.');
            }
            this.others.push('LIMIT ' + n + ',' + m);
            return this;
        }
        this.others.push('LIMIT ' + n);
        return this;
    },
    orderBy: function (field, sort) {
        if (this.isArray(field)) {
            // make sure all the params are array type
            for (var i = 0; i < arguments.length; i ++) {
                if (!this.isArray(arguments[i])) {
                    throw new Error('orderBy params error.');
                }
            }
            var fields = [];
            var sorts = [];
            for (i = 0; i < arguments.length; i ++) {
                // this.orderBy(arguments[i][0], arguments[i][1]);
                fields.push(arguments[i][0]);
                sorts.push(arguments[i][1]);
            }
            for (i = 0; i < fields.length; i ++) {
                fields[i] = this.escapeField(fields[i]) + ' ' + sorts[i].toUpperCase();
            }
            this.others.push('ORDER BY ' + fields.join(','));
        } else if (typeof(field) === 'string' && typeof(sort) === 'string') {
            sort = sort || 'DESC';
            console.log(field);
            console.log(this.escapeField(field));
            this.others.push('ORDER BY ' + this.escapeField(field) + ' ' + sort.toUpperCase());
        } else {
            throw new Error('orderBy params error.')
        }
        return this;
    },
    groupBy: function (field) {
        this.others.push('GROUP BY ' + this.escapeField(field));
        return this;
    },
    having: function (field, opr, value) {
        // if this.others include 'group by', 'having' should after 'group by'.
        var index = -1;
        for (var i = 0; i < this.others.length; i ++) {
            if (/GROUP BY/.test(this.others[i])) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            var statement = 'HAVING ' + this.escapeField(field) + ' '
            + opr + ' ' + this.sqlstring.escape(value);
            this.others.splice(index + 1, 0, statement);
        }
    },
    get: function () {
        var sql = this.buildSql();
        this.statement = sql;
        return this;
    },
    insert: function (obj) {
        if (!this.isObject(obj)) {
            throw new Error('Update param one must be a object');
        }
        var sql = this.buildInsertSql(obj);
        this.statement = sql;
        return this;
    },
    update: function (obj) {
        if (!this.isObject(obj)) {
            throw new Error('Update param one must be a object');
        }
        var sql = this.buildUpdateSql(obj);
        this.statement = sql;
        return this;
    },
    delete: function () {
        var sql = this.buildDeleteSql();
        this.statement = sql;
        return this;
    },
    execute: function () {
        return this.connection.execute(this.statement);
    },
    // Private Methods
    buildJoin: function (item) {
        return item.prefix + ' JOIN ' + item.table + ' ON '
        + item.baseKey + ' = ' + item.joinKey;
    },
    buildSql: function () {
        var fields = [];
        // Fields
        if (this.fields.length === 0) {
            fields = '*';
        } else {
            fields = this.fields.join(',');
        }
        // join
        var join_strs = [];
        for (var i = 0; i < this.joins.length; i ++) {
            join_strs.push(this.buildJoin(this.joins[i]));
        }
        join_strs = join_strs.join(' ');
        // where
        var conditions = this.conditions.buildSql();
        // other
        var others = this.others.join(' ');
        var sql = 'SELECT {fields} FROM {table} {join}';
        if (conditions) {
            sql += ' WHERE {conditions}';
        }
        sql += ' {other}';
        sql = sql.replace('{fields}', fields);
        sql = sql.replace('{table}', this.tableName);
        sql = sql.replace('{join}', join_strs);
        sql = sql.replace('{conditions}', conditions);
        sql = sql.replace('{other}', others);
        return sql;
    },
    buildUpdateSql: function (obj) {
        var conditions = this.conditions.buildSql();
        var fields = [];
        var values = [];
        for (var key in obj) {
            fields.push(key);
            values.push(obj[key]);
        }
        var update = [];
        for (var i = 0; i < fields.length; i ++) {
            update.push(this.escapeField(fields[i]) + ' = ' + this.sqlstring.escape(values[i]));
        }
        update = update.join(',');
        var sql = 'UPDATE {table} SET {update} WHERE {conditions}';
        sql = sql.replace('{table}', this.tableName);
        sql = sql.replace('{update}', update);
        sql = sql.replace('{conditions}', conditions);
        return sql;
    },
    buildDeleteSql: function () {
        var conditions = this.conditions.buildSql();
        var sql = 'DELETE FROM {table} WHERE {conditions}';
        sql = sql.replace('{table}', this.tableName);
        sql = sql.replace('{conditions}', conditions);
        return sql;
    },
    buildInsertSql: function (obj) {
        var fields = [];
        var values = [];
        for (var key in obj) {
            fields.push(this.escapeField(key));
            values.push(this.sqlstring.escape(obj[key]));
        }
        fields = fields.join(',');
        fields = '(' + fields + ')';
        values = values.join(',');
        var sql = 'INSERT INTO ' + this.tableName + ' '
        + fields + ' VALUES (' + values + ')';
        return sql;
    },
    setConnection: function (c) {
        // reload connection instance
        this.connection._setConnection = c;
        this.connection._inTransaction = true;
        return this;
    },
    getType: function (o) {
        return Object.prototype.toString.call(o);
    },
    isObject: function (o) {
        return this.getType(o) === '[object Object]';
    },
    isArray: function (o) {
        return this.getType(o) === '[object Array]';
    },
    escapeField: function (o) {
        var tableName = null;
        var columnName = null;
        if (o.indexOf('.') > -1) {
            var tmp = o.split('.');
            if (tmp.length === 1) {
                columnName = tmp[0];
            } else if (tmp.length >= 2) {
                tableName = tmp[0];
                columnName = tmp[1];
            }
        } else {
            columnName = o;
        }
        if (!tableName) {
            return '`' + columnName + '`';
        }
        return '`' + tableName + '`.`' + columnName + '`';
    }
});