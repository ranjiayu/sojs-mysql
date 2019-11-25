require('sojs');
sojs.setPath({'sojs.mysql': __dirname});
module.exports = sojs.using('sojs.mysql');