var cdb = require('cartodb.js');
var template = require('./custom-list-search.tpl');

module.exports = cdb.core.View.extend({

  className: 'CustomList-form CDB-Box-modalHeader',
  tagName: 'form',

  events: {
    'keyup .js-search': '_onSearchType',
    'click .js-clear': '_onClickClear',
    'submit': '_submit'
  },

  initialize: function () {
    this._initBinds();
  },

  render: function () {
    this.$el
      .empty()
      .append(
        template({
          query: this.model.get('query'),
          typeLabel: this.options.typeLabel
        })
      );
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:query', this._checkButtons, this);
  },

  _checkButtons: function () {
    var query = this.model.get('query');
    this.$('.js-clear').toggle(query.length > 0);
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
