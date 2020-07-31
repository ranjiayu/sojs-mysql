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
        relation = relation || 'and';
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
        } else if (typeof(field) === 'object') {
            // if field is 
            if (field.__proto__ && field.__proto__.__full === 'sojs.mysql.whereGroup') {
                this.conditions.push({
                    group: field,
                    relation: relation
                });
            }
        }
    },
    orWhere: function (field, value) {
        value = value || '';
        this.where(field, value, 'OR');
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
            if (i != 0) {
                sql += ' ' + c.relation + ' ';
            }
            if (c.group) {
                sql += '(' + c.condition.buildSql() + ')';
                this.args = this.args.concat(c.args);
            } else {
                sql += this.dumpCondition(c.field, c.opr, c.value);
            }
        }
        return sql;
    },
    isArray: function (o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }
});