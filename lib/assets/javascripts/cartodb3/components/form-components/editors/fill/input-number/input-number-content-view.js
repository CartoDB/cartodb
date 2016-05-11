var cdb = require('cartodb.js');
var Backbone = require('backbone');
var template = require('./input-number-value-content-view.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack',
    'click .js-quantification': '_onClickQuantification'
  },

  initialize: function (opts) {
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      attribute: this.model.get('attribute'),
      quantification: this.model.get('quantification')
    }));

    this._minValue = new Backbone.Form.editors.Number({
      schema: {},
      value: this.model.get('range') ? this.model.get('range')[0] : this.model.get('fixed')
    });

    this._maxValue = new Backbone.Form.editors.Number({
      schema: {},
      value: this.model.get('range') ? this.model.get('range')[1] : this.model.get('fixed')
    });

    this._minValue.bind('change', this._updateMinValue, this);
    this._maxValue.bind('change', this._updateMaxValue, this);

    this.$el.append(this._minValue.render().$el);
    this.$el.append(this._maxValue.render().$el);

    return this;
  },

  _updateMinValue: function (input) {
    var range = this.model.get('range');
    range[0] = input.value;
    this._updateRange(range);
  },

  _updateMaxValue: function (input) {
    var range = this.model.get('range');
    range[1] = input.value;
    this._updateRange(range);
  },

  _updateRange: function (range) {
    this.model.set('range', range);
    this.model.trigger('change:range', this.model, range);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onClickQuantification: function (e) {
    this.killEvent(e);
    this.trigger('selectQuantification', this);
  }
});
