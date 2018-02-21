var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./input-number.tpl');
var InputDialogContent = require('./input-number-dialog-content');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'CDB-OptionInput-item',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    if (this.options.editorAttrs && this.options.editorAttrs.help) {
      this._help = this.options.editorAttrs.help;
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this.options.disabled) {
      this.$el.addClass('is-disabled');
    }

    this.$el.html(template({
      help: this._help || '',
      value: this._getValue()
    }));

    this._initViews();

    return this;
  },

  _initViews: function () {
    if (this._help) {
      var tooltip = new TipsyTooltipView({
        el: this.$('.js-help'),
        gravity: 'w',
        title: function () {
          return $(this).data('tooltip');
        }
      });
      this.addView(tooltip);
    }
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
    this.model.set('createContentView', function () {
      return this._createContentView();
    }.bind(this));

    this.listenTo(this.model, 'change:selected', this._onToggleSelected);
    this.listenTo(this.model, 'change:fixed', this._onChangeValue);
    this.listenTo(this.model, 'change:range', this._onChangeValue);
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
