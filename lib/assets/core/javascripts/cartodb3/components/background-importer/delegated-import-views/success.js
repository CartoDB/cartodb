var template = require('./success.tpl');

function getAction () {
  var service = _model.get('upload').service_name;
  var tables_created_count = _model.get('import').tables_created_count;

  if (_showDetails) {
    if (service && service === 'twitter_search') {
      return 'show_stats';
    } else if (tables_created_count === 1) {
      return 'show_table';
    }
  }

  return false;
}

function getButton () {
  var service = _model.get('upload').service_name;
  var tables_created_count = _model.get('import').tables_created_count;

  if (_showDetails) {
    if (service && service === 'twitter_search') {
      return _t('components.background-importer.background-importer-item.show');
    } else if (tables_created_count === 1) {
      return _t('components.background-importer.background-importer-item.show');
    }
  }

  return false;
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

var _model;
var _notification;
var _status;
var _showDetails;

module.exports = function (model, notification, status, info, showDetails) {
  _model = model;
  _notification = notification;
  _status = status;
  _showDetails = showDetails;
  updateNotification(template(info));
};
