var _ = require('underscore');

module.exports = function checkAndBuildRequiredOpts (actualOpts, requiredOpts, context) {
  _.each(requiredOpts, function (item) {
    if (actualOpts[item] === undefined) throw new Error(item + ' is required');
    context['_' + item] = actualOpts[item];
  }, context);
};
