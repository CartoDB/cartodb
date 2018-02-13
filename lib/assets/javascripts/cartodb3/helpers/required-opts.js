var _ = require('underscore');

module.exports = function checkAndBuildRequiredOpts (actualOpts, requiredOpts, context) {
  if (_.isUndefined(requiredOpts)) {
    throw new Error('Opts are required');
  }

  _.each(requiredOpts, function (item) {
    if (_.isUndefined(actualOpts[item])) throw new Error(item + ' is required');
    context['_' + item] = actualOpts[item];
  }, context);
};
