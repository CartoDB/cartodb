var Backbone = require('backbone');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'title',
  'name'
];

/**
 *  Selected import model
 */

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._status = opts.status;
  }

});
