var cdb = require('cartodb.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({

  defaults: {
    merge_flavor: undefined, // ['regular', 'spatial'], set when user selects what kind of merge to do
    canApplyRegularMerge: true,
    nextButtonText: 'Next step'
  }

});
