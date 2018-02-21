var CoreView = require('backbone/core-view');
var template = require('./toggler.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

module.exports = CoreView.extend({

  className: 'Toggle',

  events: {
    'click .js-input': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.model) throw new Error('togglerModel should be provided');

    this.model = opts.model;
    this._onChange = this.model.get('onChange');

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(
      template({
        labels: this.model.get('labels'),
        checked: this.model.get('active'),
        disabled: this.model.get('disabled') && this.model.get('isDisableable')
      })
    );

    this._initViews();

    return this;
  },

  _initViews: function () {
    if (this.model.get('tooltip')) {
      var helpTooltip = new TipsyTooltipView({
        el: this.$('.js-input'),
        gravity: 's',
        offset: 0,
        title: function () {
          return this.model.get('tooltip');
        }.bind(this)
      });
      this.addView(helpTooltip);
    }
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:active', this.render);
    this.listenTo(this.model, 'change:disabled', this.render);
  },

  _onClick: function () {
    this.model.set('active', !this.model.get('active'));
  }
});
