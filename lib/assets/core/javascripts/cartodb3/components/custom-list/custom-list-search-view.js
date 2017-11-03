var CoreView = require('backbone/core-view');
var template = require('./custom-list-search.tpl');

module.exports = CoreView.extend({

  className: 'CustomList--full',
  tagName: 'form',

  events: {
    'keyup .js-search': '_onSearchType',
    'click .js-clear': '_onClickClear',
    'submit': '_submit'
  },

  initialize: function () {
    this.template = this.options.template || template;
    this.searchPlaceholder = this.options.searchPlaceholder || _t('components.custom-list.placeholder', { typeLabel: this.options.typeLabel });
    this._initBinds();
  },

  render: function () {
    this.$el
      .empty()
      .append(
        this.template({
          query: this.model.get('query'),
          searchPlaceholder: this.searchPlaceholder
        })
      );
    return this;
  },

  _initBinds: function () {
    this.model.on('change:query', this._checkButtons, this);
  },

  _checkButtons: function () {
    var query = this.model.get('query');
    this.$('.js-clear').toggleClass('u-transparent', query.length === 0);
  },

  _onSearchType: function (e) {
    this._submit();
  },

  _onClickClear: function (e) {
    e.stopPropagation();
    this.model.set('query', '');
    this.render();
    this.focus();
  },

  focus: function () {
    this.$('.js-search').focus();
  },

  _submit: function (ev) {
    this.killEvent(ev);
    var query = this.$('.js-search').val();
    this.model.set('query', query);
  }
});
