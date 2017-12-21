var _ = require('underscore');

module.exports = function checkAndBuildRequiredOpts (actualOpts, requiredOpts, context) {
  if (requiredOpts === void 0) {
    throw new Error('Opts are required');
  }

  _.each(requiredOpts, function (item) {
    if (actualOpts[item] === void 0) throw new Error(item + ' is required');
    context['_' + item] = actualOpts[item];
  }, context);
};
