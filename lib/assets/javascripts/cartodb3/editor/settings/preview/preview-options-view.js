var _ = require('underscore');
var CoreView = require('backbone/core-view');
var OptionsItemView = require('./preview-options-item-view');
var template = require('./preview-options.tpl');

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

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._settingsCollection.on('change', this._onChangeOptions, this);
    this.add_related_model(this._settingsCollection);
  },

  _onChangeOptions: function (m) {
    var handler = m.get('related');
    var property = m.get('setting');
    var value = m.get('enabler');

    if (handler === 'overlays') {
      this._overlayHandler(property, value);
    }
  },

  _initViews: function () {
    this._settingsCollection.each(this._renderSetting, this);
  },

  _renderSetting: function (model) {
    var view = new OptionsItemView({
      model: model
    });

    this.$('.js-settings').append(view.render().$el);
    this.addView(view);
  },

  _overlayHandler: function (property, value) {
    if (value === false) {
      this._overlaysCollection.removeOverlay(property);
    } else {
      this._overlaysCollection.createOverlay(property);
    }
  },

  _editorHandler: function (property, value) {
    console.log('editor', property, value);
  },

  _mapHandler: function (property, value) {
    var payload = {};
    payload[property] = value;
    this._mapDefinitionModel.save(payload);
  }
});
