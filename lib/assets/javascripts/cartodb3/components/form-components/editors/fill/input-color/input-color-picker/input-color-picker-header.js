var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./input-color-picker-header.tpl');

module.exports = CoreView.extend({
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
      index: this.model.get('index'),
      label: this._getColor().title || _t('form-components.editors.fill.input-categories.others')
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

  _onClickColor: function (ev) {
    this.killEvent(ev);
    this.model.set('index', $(ev.target).index());
  },

  _onClickBack: function (ev) {
    this.killEvent(ev);
    this.trigger('back', this);
  }
});
