var cdb = require('cartodb.js');
var template = require('./input-color.tpl');
var InputDialogContent = require('./input-color-dialog-content');

module.exports = cdb.core.View.extend({
  tagName: 'li',
  className: 'CDB-OptionInput-item',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this.options.disabled) {
      this.$el.addClass('is-disabled');
    }

    this.$el.html(template({
      value: this._getValue(),
      opacity: this.model.get('opacity') || 1
    }));

    return this;
  },

  _createContentView: function () {
    var view = new InputDialogContent({
      model: this.model,
      columns: this._columns,
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

  _initBinds: function () {
    var self = this;

    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:selected', this._onToggleSelected, this);
    this.model.on('change:fixed', this.render, this);
    this.model.on('change:range', this.render, this);
  },

  _getValue: function () {
    var value = this.model.get('fixed');

    if (this.model.get('range')) {
      value = this.model.get('range');
    }

    return value;
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  }
});
