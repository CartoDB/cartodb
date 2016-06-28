var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./privacy-item.tpl');

module.exports = CoreView.extend({
  className: 'Card Card--privacy',
  tagName: 'li',

  events: {
    'click': '_onClick',
    'keyup .js-input': '_onKeyUpPasswordInput',
    'focus .js-input': '_onFocus',
    'blur .js-input': '_onBlur'
  },

  initialize: function (opts) {
    if (!opts.model) throw new Error('model is required');
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.on('change:disabled', this.render, this);
    this.model.on('change:selected', this._onSelect, this);
    this.model.on('change:password', this._onChangePassword, this);
  },

  _initViews: function () {
    var privacy = !this.model.isPassword() ? this.model.get('privacy') : false;
    var body = !this.model.isPassword() ? this.model.get('desc') : false;

    var view = template({
      title: this.model.get('title'),
      privacy: privacy,
      body: body,
      cssClass: this.model.get('cssClass'),
      password: this.model.get('password')
    });

    this.$el.append(view);
    this._onSelect();
    this.model.isPassword() && this._focusPassword();
  },

  _onClick: function () {
    if (!this.model.get('disabled')) {
      this.model.set({selected: true});
      this._focusPassword();
    }
  },

  _focusPassword: function () {
    var self = this;
    _.defer(function () {
      self.$('.js-input').focus();
    });
  },

  _onFocus: function () {
    if (this.model.isPassword() && this.model.isSelected()) {
      this.$('.js-input')
        .val('')
        .keyup();
    }
  },

  _onBlur: function () {
    this.$('.js-input')
      .val(this.model.get('password'));
  },

  _onSelect: function () {
    this.$el.toggleClass('is-selected', this.model.isSelected());
  },

  _onKeyUpPasswordInput: function (e) {
    var value = e.target.value;
    if (this.model.isPassword() && value !== '') {
      this.model.set('password', value);
    }
  }

});
