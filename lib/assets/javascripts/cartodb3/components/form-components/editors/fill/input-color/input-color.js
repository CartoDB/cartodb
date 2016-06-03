var _ = require('underscore');
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
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.query) throw new Error('query param is required');
    if (!opts.columns) throw new Error('columns is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._query = opts.query;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this.options.disabled) {
      this.$el.addClass('is-disabled');
    }

    var column = this._getColumn();
    var columnType = column && column.type;

    this.$el.html(template({
      columnType: columnType,
      value: this._getValue(),
      opacity: this.model.get('opacity')
    }));

    return this;
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _createContentView: function () {
    var view = new InputDialogContent({
      configModel: this._configModel,
      query: this._query,
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
    this.model.on('change:opacity', this.render, this);
    this.model.on('change:fixed', this.render, this);
    this.model.on('change:range', this.render, this);
  },

  _getValue: function () {
    var value = this.model.get('fixed');

    if (value) {
      value = this._getRGBA(value, this.model.get('opacity'));
    }

    if (this.model.get('range') && this.model.get('range').length) {
      value = this.model.get('range');
    }

    return value;
  },

  _getRGBA: function (color, opacity) {
    return 'rgba(' + parseInt(color.slice(-6, -4), 16) + ',' +
     parseInt(color.slice(-4, -2), 16) + ',' +
    parseInt(color.slice(-2), 16) + ',' +
    opacity + ')';
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  }
});
