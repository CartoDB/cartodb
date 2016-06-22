var CoreView = require('backbone/core-view');
var template = require('./data-show-more.tpl');
var LIMIT = 5;

module.exports = CoreView.extend({

  events: {
    'click .js-button': '_clickHandler'
  },

  initialize: function (opts) {
    if (!opts.columnModel) throw new Error('columnModel is required');
    if (!opts.onClick) throw new Error('onClick is required');

    this._columnModel = opts.columnModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._columnModel.bind('change', this.render, this);
    this.add_related_model(this._columnModel);
  },

  _initViews: function () {
    var number = this._columnModel.get('columns') - LIMIT;
    var view = template({
      number: number,
      isVisible: number > 0
    });

    this.$el.append(view);
  },

  _clickHandler: function () {
    this.options.onClick();
  }
});
