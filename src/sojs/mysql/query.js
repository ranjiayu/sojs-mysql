sojs.define({
    deps: {
        sqlstring: require('sqlstring')
    },
    tableName: null,
    fields: [],
    conditions: null,
    joins: [],
    others: [],
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
                c.push('`' + columns[i] + '`');
            }
            this.fields = c;
        } else if (this.getType(columns) === '[object String]') {
            columns = '`' + columns + '`';
            this.fields = [columns];
        }
        return this;
    },
    where: function (field, value) {
        value = value || null;
        this.conditions.where(field, value);
        return this;
    },
    orWhere: function (field, value) {
        value = value || '';
        this.conditions.orWhere(field, value);
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

    limit: function (num) {
        this.others.push('LIMIT ' + num);
        return this;
    },
    orderBy: function (field, sort) {
        sort = sort || 'DESC'
        this.others.push('ORDER BY ' + field + ' ' + sort.toUpperCase());
        return this;
    },
    groupBy: function (field) {
        this.others.push('GROUP BY ' + field);
        return this;
    },
    having: function (field, opr, value) {
        // 如果有group, 生成的顺序要在group by 之后
        var index = -1;
        for (var i = 0; i < this.others.length; i ++) {
            if (/GROUP BY/.test(this.others[i])) {
                index = i;
                break;
            }
        }
        if (index != -1) {
            var statement = 'HAVING ' + field + ' '
            + opr + ' ' + this.sqlstring.escape(value);
            this.others.splice(index + 1, 0, statement);
        }
    },
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
            update.push(fields[i] + ' = ' + this.sqlstring.escape(values[i]));
        }
        update = update.join(',');
        var sql = 'UPDATE {table} SET {update} WHERE {conditions}';
        sql = sql.replace('{table}', this.tableName);
        sql = sql.replace('{update}', update);
        sql = sql.replace('{condition}', conditions);
        return sql;
    },
    buildDeleteSql: function () {
        var conditions = this.conditions.buildSql();
        var sql = 'DELETE * FROM {table} WHERE {conditions}';
        sql = sql.replace('{table}', this.tableName);
        sql = sql.replace('{conditions}', conditions);
        return sql;
    },
    buildInsertSql: function (obj) {
        var fields = [];
        var values = [];
        for (var key in obj) {
            fields.push('`' + key + '`');
            values.push(this.sqlstring.escape(obj[key]));
        }
        fields = fields.join(',');
        fields = '(' + field + ')';
        values = values.join(',');
        var sql = 'INSERT INTO ' + this.tableName + ' '
        + field + ' VALUES (' + values + ')';
        return sql;
    },
    get: function () {
        var sql = this.buildSql();
        return this.connection.execute(sql);
    },
    insert: function (obj) {
        if (!this.isObject(obj)) {
            throw new Error('Update param one must be a object');
        }
        var sql = this.buildInsertSql(obj);
        return this.connection.execute(sql);
    },
    update: function (obj) {
        if (!this.isObject(obj)) {
            throw new Error('Update param one must be a object');
        }
        var sql = this.buildUpdateSql(obj);
        return this.connection.execute(sql);
    },
    delete: function () {
        var sql = this.buildDeleteSql();
        return this.connection.execute(sql);
    },
    getType: function (o) {
        return Object.prototype.toString.call(o);
    },
    isObject: function (o) {
        return this.getType(o) === '[object Object]';
    }
});