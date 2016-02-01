var cdb = require('cartodb.js-v3');

/**
 * View to handle the visual representation of a publish option.
 */
module.exports = cdb.core.View.extend({

  className: 'OptionCard OptionCard--static',

  events: {
    'click input': '_onClickInput'
  },

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate(this.model.get('template'));
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.html(
      this._template({
        model: this.model
      })
    );
    this.$el.toggleClass('is-disabled', !!this.model.isDisabled());

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _onClickInput: function(ev) {
    this.killEvent(ev);
    this.$('input').select();
  }

});
