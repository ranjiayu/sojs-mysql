sojs.define({
    name: 'whereGroup',
    namespace: 'sojs.mysql',
    deps: {
        sqlstring: require('sqlstring')
    },
    $whereGroup: function () {},
    conditions: [],
    args: [],
    where: function (field, value, relation) {
        relation = relation || 'AND';
        if (typeof(field) === 'string') {
            var fieldAndOpr = field.split('__');
            // field
            var field = fieldAndOpr[0];
            // operator
            if (fieldAndOpr.length === 2) {
                var opr = fieldAndOpr[1];
            } else {
                // default operator is equal
                var opr = '=';
            }
            this.conditions.push({
                field: field,
                value: value,
                opr: opr,
                relation: relation
            });
        } else if (typeof(field) === 'function') {
            // 如果是函数, 则创建一个whereGroup, 构造完整where语句, 然后加上括号
            var fn = field;
            var _tmp = sojs.create('sojs.mysql.whereGroup');
            fn(_tmp);
            var sql = _tmp.buildSql();
            this.conditions.push({
                opr: relation,
                sql: sql
            });
        }
    },
    orWhere: function (field, value) {
        value = value || '';
        this.where(field, value, 'OR');
    },
    notWhere: function (field, value) {
        if (value === null || value === undefined) {
            this.where(field + '__isnull', false);
        } else {
            this.where(field + '__neq', value);
        }
        return this;
    },
    dumpCondition: function (field, opr, value) {
        if (field.indexOf('.') > -1) {
            var tmp = field.split('.');
            field = '`' + tmp[0] + '`.`' + tmp[1] + '`';
        } else {
            field = '`' + field + '`';
        }
        var valueStr;
        var valueEscaped = this.sqlstring.escape(value);
        var oprLower = opr.toLowerCase();
        if (oprLower === 'in') {
            if (!this.isArray(value)) {
                throw new Error('IN operator value must be an array.');
            }
            valueStr = '(' + valueEscaped + ')';
        } else if (oprLower === 'lte') {
            opr = '<=';
            valueStr = valueEscaped;
        } else if (oprLower === 'lt') {
            opr = '<';
            valueStr = valueEscaped;
        } else if (oprLower === 'gte') {
            opr = '>=';
            valueStr = valueEscaped;
        } else if (oprLower === 'gt') {
            opr = '>';
            valueStr = valueEscaped;
        } else if (oprLower === 'range') {
            opr = 'BETWEEN';
            if (!this.isArray(value)) {
                throw new Error('BETWEEN operator value must be an array with length 2.');
            }
            if (value.length && value.length != 2) {
                throw new Error('BETWEEN operator value must be an array with length 2.')
            }
            valueStr = this.sqlstring.escape(value[0]) + ' AND ' + this.sqlstring.escape(value[1]);
        } else if (oprLower === 'eq') {
            opr = '=';
            valueStr = valueEscaped;
        } else if (oprLower === 'neq') {
            opr = '!=';
            valueStr = valueEscaped;
        } else if (oprLower === 'isnull') {
            // make sure the value is boolean
            if (!this.isBoolean(value)) {
                throw new Error('isnull function expect a boolean param.');
            }
            valueStr = 'NULL';
            if (value) {
                opr = 'IS';
            } else {
                opr = 'IS NOT';
            }
        } else {
            this.args.push(value);
            valueStr = valueEscaped;
        }
        return field + ' ' + opr + ' ' + valueStr;
    },
    buildSql: function () {
        var sql = '';
        for (var i = 0; i < this.conditions.length; i ++) {
            var c = this.conditions[i];
            if (!c.sql) {
                if (i != 0) {
                    sql += ' ' + c.relation + ' ';
                }
                sql += this.dumpCondition(c.field, c.opr, c.value);
            } else {
                sql += ' ' + c.opr + ' (' + c.sql + ')';
            }
        }
        return sql;
    },
    isArray: function (o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    },
    isBoolean: function (o) {
        return typeof(o) === 'boolean';
    }
});