var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./setting.tpl');

require('../../components/form-components/index');

var REQUIRED_OPTS = [
  'setting',
  'mapModel'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.$el.html(template({
      label: _t('editor.settings.options.' + this._setting)
    }));

    this._switchView = new Backbone.Form.editors.Switch({
      key: this._setting,
      model: this._mapModel,
      schema: {
        options: this._mapModel.get(this._setting)
      }
    });

    this._switchView.on('change', this._commitView, this);

    this.$('.js-setting').append(this._switchView.render().$el);
  },

  _commitView: function (view) {
    view.commit();
  },

  _removeBinds: function () {
    this._switchView && this._switchView.off('change', this._commitView, this);
  },

  clean: function () {
    this._removeBinds();
    CoreView.prototype.clean.call(this);
  }
});
