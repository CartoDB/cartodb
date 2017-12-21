var CoreView = require('backbone/core-view');
var _ = require('underscore');
var OptionsView = require('./preview-options-view');

var REQUIRED_OPTS = [
  'mapDefinitionModel',
  'settingsCollection',
  'overlaysCollection'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._renderOptions();
    return this;
  },

  _renderOptions: function () {
    var view = new OptionsView({
      mapDefinitionModel: this._mapDefinitionModel,
      settingsCollection: this._settingsCollection,
      overlaysCollection: this._overlaysCollection
    });

    this.$el.append(view.render().el);
    this.addView(view);
  }
});
