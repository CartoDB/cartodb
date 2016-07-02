var CoreView = require('backbone/core-view');
var _ = require('underscore');
var ScrollView = require('../components/scroll/scroll-view');
var SettingsView = require('./settings/settings-view');

var REQUIRED_OPTS = [
  'mapDefinitionModel'
];

module.exports = CoreView.extend({
  className: 'SettingsEditor Editor-panel',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;
    var view = new ScrollView({
      createContentView: function () {
        return new SettingsView({
          mapDefinitionModel: self._mapDefinitionModel
        });
      }
    });

    this.$el.append(view.render().$el);
    this.addView(view);
  }
});
