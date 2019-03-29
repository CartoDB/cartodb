var template = require('./loading.tpl');

function getAction () {
  return false;
}

function getButton () {
  return false;
}

function getClosable () {
  var state = _model.get('state');
  var step = _model.get('step');
  return state === 'uploading' && step === 'upload';
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

var _model;
var _notification;
var _status;

module.exports = function (model, notification, status, info, showDetails) {
  _model = model;
  _notification = notification;
  _status = status;
  updateNotification(template(info));
};
