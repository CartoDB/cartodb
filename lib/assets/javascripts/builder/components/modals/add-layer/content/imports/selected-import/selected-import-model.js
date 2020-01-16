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

  defaults: {
    state: 'idle'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._status = opts.status;
    this._beta = opts.beta;
  }

});
