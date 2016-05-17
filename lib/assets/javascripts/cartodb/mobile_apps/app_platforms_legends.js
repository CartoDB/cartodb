var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

module.exports = cdb.core.View.extend({

  events: {
    'change .js-appPlatformsLegendOption': '_changePlatformValue'
  },

  initialize: function () {
    this.model = new cdb.core.Model({
      value: ''
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change:value', this._changeIdPlatformLegends, this);
  },

  _changePlatformValue: function (ev, ui) {
    this.model.set('value', ev.target.value);
  },

  _changeIdPlatformLegends: function () {
    var platforms = this.options.app_platforms;
    this.$('.js-appPlatformsLegend').html(platforms[this.model.get('value')]['legend']);
  }

});
