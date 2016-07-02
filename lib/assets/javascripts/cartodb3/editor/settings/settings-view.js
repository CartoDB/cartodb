var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var SettingItemView = require('./setting-item-view');
var template = require('./settings.tpl');

var REQUIRED_OPTS = [
  'mapDefinitionModel',
  'settingsCollection'
];

module.exports = CoreView.extend({
  className: 'Editor-panel',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    // Better initialization needed here
    this._modelOptions = new Backbone.Model(this._createModelOptions());

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _createModelOptions: function () {
    return this._settingsCollection.reduce(function (memo, model) {
      if (model.get('enabled') === true) {
        memo[model.get('setting')] = model.get('default');
      }
      return memo;
    }, {});
  },

  _initBinds: function () {
    this._modelOptions.on('change', this._onChangeOptions, this);
    this.add_related_model(this._modelOptions);
  },

  _onChangeOptions: function () {
    var changed = this._modelOptions.changedAttributes();
    // To persist!
    console.log(changed);
  },

  _initViews: function () {
    _.each(this._settingsCollection.filter(function (model) {
      return model.get('enabled') === true;
    }), this._renderSetting, this);
  },

  _renderSetting: function (model) {
    var view = new SettingItemView({
      mapModel: this._modelOptions,
      model: model
    });

    this.$('.js-settings').append(view.render().$el);
    this.addView(view);
  }
});
