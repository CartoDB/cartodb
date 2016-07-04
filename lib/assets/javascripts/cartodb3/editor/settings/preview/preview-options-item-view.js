var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var enablerTemplate = require('./enabler.tpl');
require('../../../components/form-components/index');

var REQUIRED_OPTS = [
  'model',
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
    this._enablerView = new Backbone.Form.editors.Enabler({
      template: enablerTemplate,
      model: this._mapModel,
      title: this.model.get('label'),
      help: '',
      key: this.model.get('setting')
    });

    this._enablerView.on('change', this._commitView, this);
    this.$el.append(this._enablerView.render().$el);
  },

  _commitView: function (view) {
    view.commit();
  },

  _removeBinds: function () {
    this._enablerView && this._enablerView.off('change', this._commitView, this);
  },

  clean: function () {
    this._removeBinds();
    CoreView.prototype.clean.call(this);
  }
});
