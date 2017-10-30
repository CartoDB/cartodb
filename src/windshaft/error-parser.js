var _ = require('underscore');
var WindshaftError = require('./error');

var parseWindshaftErrors = function (response) {
  response = response || {};
  if (response.errors_with_context) {
    return _.map(response.errors_with_context, function (error) {
      return new WindshaftError(error);
    });
  }
  if (response.errors) {
    return [
      new WindshaftError({ message: response.errors[0] })
    ];
  }
  return [];
};

module.exports = parseWindshaftErrors;
