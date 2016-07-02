var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var SettingItemView = require('./setting-item-view');
var template = require('./settings.tpl');

var REQUIRED_OPTS = [
  'mapDefinitionModel'
];

var SETTINGS = ['title', 'description', 'search', 'zoom', 'fullscreen', 'share', 'scrollwheel', 'layer_selector', 'legends', 'logo'];

module.exports = CoreView.extend({
  className: 'Editor-panel',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    // Better initialization needed here
    this._modelOptions = new Backbone.Model({
      title: false,
      description: false,
      search: false,
      layer_selector: false,
      fullscreen: false,
      share: true,
      logo: true,
      zoom: true,
      scrollwheel: false,
      legends: true
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
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
    _.each(SETTINGS, this._renderSetting, this);
  },

  _renderSetting: function (setting) {
    var view = new SettingItemView({
      mapModel: this._modelOptions,
      setting: setting
    });

    this.$('.js-settings').append(view.render().$el);
    this.addView(view);
  }
});
