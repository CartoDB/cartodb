var CoreView = require('backbone/core-view');
var template = require('./input-number.tpl');
var InputDialogContent = require('./input-number-dialog-content');

module.exports = CoreView.extend({
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
      value: this._getValue()
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
    this.model.on('change:fixed', this._onChangeValue, this);
    this.model.on('change:range', this._onChangeValue, this);
  },

  _getValue: function () {
    // 1.0 -> 1
    function dropDecimal (f) {
      return f.replace(/\.0$/, '');
    }

    if (this.model.get('range')) {
      return this.model.get('range').map(function (v) {
        return dropDecimal((+v).toFixed(1));
      }).join('..');
    }
    return dropDecimal((+this.model.get('fixed')).toFixed(1));
  },

  _onChangeValue: function () {
    this.$('.js-value').text(this._getValue());
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  }
});
