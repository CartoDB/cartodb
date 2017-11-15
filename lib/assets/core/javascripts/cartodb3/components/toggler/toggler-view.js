var CoreView = require('backbone/core-view');
var template = require('./toggler.tpl');

module.exports = CoreView.extend({

  className: 'Toggle',

  events: {
    'click .js-input': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.model) throw new Error('togglerModel should be provided');

    this.model = opts.model;
    this._onChange = this.model.get('onChange');

    this.listenTo(this.model, 'change:active', this.render);
    this.listenTo(this.model, 'change:disabled', this.render);
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

    return this;
  },

  _onClick: function () {
    this.model.set('active', !this.model.get('active'));
  }
});
