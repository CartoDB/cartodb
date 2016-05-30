var $ = require('jquery');
var cdb = require('cartodb.js');
var template = require('./input-color-picker-header.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-color': '_onClickColor'
  },

  initialize: function (opts) {
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      ramp: this.model.get('ramp'),
      label: this._getColor().title
    }));

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _getColor: function () {
    var ramp = this.model.get('ramp');
    return ramp[this.model.get('index')];
  },

  _onClickColor: function (e) {
    this.killEvent(e);
    this.model.set('index', $(e.toElement).index());
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  }
});
