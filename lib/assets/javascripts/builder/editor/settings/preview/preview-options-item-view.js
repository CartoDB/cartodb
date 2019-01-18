var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var enablerTemplate = require('./enabler.tpl');
require('builder/components/form-components/index');

var REQUIRED_OPTS = [
  'model'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    // For enabler compatibility
    this.model.set(this.model.get('setting'), this.model.get('enabler'), {silent: true});
  },

  render: function () {
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._enablerView = new Backbone.Form.editors.Enabler({
      template: enablerTemplate,
      model: this.model,
      inputId: this.cid,
      title: this.model.get('label'),
      disabled: this.model.get('disabled'),
      help: '',
      key: this.model.get('setting')
    });

    this.$el.append(this._enablerView.render().$el);
  }
});
