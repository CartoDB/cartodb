var cdb = require('cartodb.js');
var Backbone = require('backbone');
var template = require('./input-number-value-content-view.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-next': '_onClickDistribution'
  },

  initialize: function (opts) {
    if (!opts.columnName) throw new Error('columnName is required');
    if (!opts.distribution) throw new Error('distribution is required');

    this._columnName = opts.columnName;
    this._distribution = opts.distribution;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      columnName: this._columnName,
      distribution: this._distribution
    }));

    var self = this;

    this._minValue = new Backbone.Form.editors.Number({
      schema: {},
      value: this.model.get('min') || 0
    });

    this._minValue.bind('change', function (input) {
      self.model.set('min', input.value);
    }, this);

    this._maxValue = new Backbone.Form.editors.Number({
      schema: {},
      value: this.model.get('max') || this.model.get('value')
    });

    this._maxValue.bind('change', function (input) {
      self.model.set('max', input.value);
    }, this);

    this.$el.append(this._minValue.render().$el);
    this.$el.append(this._maxValue.render().$el);

    return this;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickDistribution: function (e) {
    this.killEvent(e);
    this.trigger('next', this);
  }
});
