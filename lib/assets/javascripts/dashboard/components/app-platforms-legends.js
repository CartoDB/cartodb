const Backbone = require('backbone');
const CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  events: {
    'change .js-appPlatformsLegendOption': '_changePlatformValue'
  },

  initialize: function (options) {
    this.model = new Backbone.Model({
      value: ''
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:value', this._changeIdPlatformLegends);
  },

  _changePlatformValue: function (ev) {
    this.model.set('value', ev.target.value);
  },

  _changeIdPlatformLegends: function () {
    const legend = this.options.appPlatforms[this.model.get('value')]['legend'];
    this.$('.js-appPlatformsLegend').html(legend);
  }
});
