var cdb = require('cartodb.js');
var template = require('./input-categories.tpl');
var InputDialogContent = require('./input-categories-dialog-content');

module.exports = cdb.core.View.extend({
  tagName: 'li',
  className: 'CDB-OptionInput-item CDB-OptionInput-item--categories',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this.options.disabled) {
      this.$el.addClass('is-disabled');
    }

    this.$el.html(template({
      categories: this.model.get('categories')
    }));

    return this;
  },

  _initBinds: function () {
    var self = this;

    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:selected', this._onToggleSelected, this);
    this.model.bind('change:categories', this.render, this);
  },

  _createContentView: function () {
    var view = new InputDialogContent({
      model: this.model,
      editorAttrs: this.options.editorAttrs
    });

    view.bind('change', this.render, this);

    return view;
  },

  _onClick: function (e) {
    if (this.options.disabled) {
      return;
    }
    this.trigger('click', this.model);
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  }
});
