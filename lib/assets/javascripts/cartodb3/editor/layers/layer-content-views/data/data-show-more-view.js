var CoreView = require('backbone/core-view');
var template = require('./data-show-more.tpl');

module.exports = CoreView.extend({

  events: {
    'click .js-button': '_clickHandler'
  },

  initialize: function (opts) {
    if (!opts.moreStatsModel) throw new Error('moreStatsModel is required');
    if (!opts.onClick) throw new Error('onClick is required');

    this._moreStatsModel = opts.moreStatsModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._moreStatsModel.bind('change:visible', this.render, this);
    this.add_related_model(this._moreStatsModel);
  },

  _initViews: function () {
    var number = this._moreStatsModel.get('shown') - this._moreStatsModel.get('limit');
    var view = template({
      number: number,
      isVisible: !!this._moreStatsModel.get('visible') && number > 0
    });

    this.$el.append(view);
  },

  _clickHandler: function () {
    this.options.onClick();
  }
});
