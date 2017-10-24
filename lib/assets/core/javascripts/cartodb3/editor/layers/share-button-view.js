var CoreView = require('backbone/core-view');
var template = require('./publish-button.tpl');
var _ = require('underscore');

var REQUIRED_OPTS = [
  'onClickAction',
  'visDefinitionModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-button': '_clickHandler'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      hasChanges: this._visDefinitionModel.get('visChanges') > 0
    }));
    return this;
  },

  _initBinds: function () {
    this._visDefinitionModel.on('change:visChanges', this.render, this);
    this.add_related_model(this._visDefinitionModel);
  },

  _clickHandler: function () {
    this._onClickAction && this._onClickAction();
  }
});
