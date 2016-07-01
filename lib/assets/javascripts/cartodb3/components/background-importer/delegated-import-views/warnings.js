var template = require('./warnings.tpl');

function getAction () {
  return 'show_warnings';
}

function getButton () {
  return _t('components.background-importer.background-importer-item.show');
}

function getClosable () {
  return true;
}

function updateNotification (info) {
  var data = {
    info: info,
    status: _status,
    closable: getClosable(),
    button: getButton(),
    action: getAction()
  };

  _notification.update(data);
}

var _notification;
var _status;

module.exports = function (model, notification, status, info, showDetails) {
  _notification = notification;
  _status = status;
  updateNotification(template(info));
};
