require('sojs');
sojs.setPath({'sojs.mysql': __dirname});
module.export = function(options) {
	return sojs.create('sojs.mysql.db', options);
};