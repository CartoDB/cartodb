var _ = require('underscore');
var WindshaftError = require('./error');

var parseWindshaftErrors = function (response, type) {
  response = response || {};
  if (response.responseJSON) {
    response = response.responseJSON;
  }
  if (response.errors_with_context) {
    return _.map(response.errors_with_context, function (error) {
      return new WindshaftError(error, type);
    });
  }
  if (response.errors) {
    var content = typeof response.errors[0] === 'string'
      ? { message: response.errors[0] }
      : response.errors[0];

    return [
      new WindshaftError(content, type)
    ];
  }
  if (response.statusText) {
    return [
      new WindshaftError({ message: response.statusText }, type, 'ajax')
    ];
  }
  return [];
};

module.exports = parseWindshaftErrors;
