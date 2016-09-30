var cdb = require('cartodb.js');
var Notifier = require('../../components/notifier/notifier');

module.exports = function (params) {
	if (!params) throw new Error('several params are required');
	if (!params.configModel) throw new Error('configModel is required');
	if (!params.sql) throw new Error('sql is required');

	this._SQL = new cdb.SQL({
	  user: params.configModel.get('user_name'),
	  sql_api_template: params.configModel.get('sql_api_template'),
	  api_key: params.configModel.get('api_key')
	});

	var notification = Notifier.addNotification({
    status: 'loading',
    info: _t('-'),
    closable: false
  });

	this._SQL.getBounds(params.sql)
		.done(function (bounds) {
			if (bounds) {
				window.vis.map.setBounds(bounds);
				notification.set({
	        status: 'success',
	        info: _t('-'),
	        closable: true
	      });
			} else {
				notification.set({
					status: 'error',
					info: _t('-'),
					closable: true
				})
			}
		})
		.error(function () {
			notification.set({
        status: 'error',
        info: _t('-'),
        closable: true
      });
		})
};