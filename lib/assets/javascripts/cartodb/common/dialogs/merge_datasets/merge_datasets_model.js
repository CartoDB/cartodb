var cdb = require('cartodb.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({

  defaults: {
    regularMerge: true,
    spatialMerge: true,
    nextButtonText: _("Next")
  }

});
