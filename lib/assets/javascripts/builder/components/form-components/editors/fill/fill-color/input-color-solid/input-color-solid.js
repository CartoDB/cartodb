var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('builder/components/form-components/editors/fill/fill-color/input-color-solid/input-color-solid.tpl');
var ColorPicker = require('builder/components/form-components/editors/fill/color-picker/color-picker');
var Utils = require('builder/helpers/utils');
var rampList = require('builder/components/form-components/editors/fill/input-color/input-quantitative-ramps/ramps');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'CDB-OptionInput-item',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (this.options.editorAttrs) {
      this._editorAttrs = this.options.editorAttrs;
      this._help = this._editorAttrs.help;
      var hidePanes = this._editorAttrs.hidePanes;

      if (hidePanes && !_.contains(hidePanes, 'value')) {
        if (!opts.configModel) throw new Error('configModel param is required');
        if (!opts.userModel) throw new Error('userModel param is required');
        if (!opts.modals) throw new Error('modals param is required');
        if (!opts.query) throw new Error('query param is required');
      }
    }

    if (!opts.columns) throw new Error('columns is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._query = opts.query;

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
      opacity: this._getOpacity(),
      help: this._help || ''
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
        },
        offset: 8
      });
      this.addView(tooltip);
    }
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _createContentView: function () {
    return this._generateFixedContentView();
  },

  _generateFixedContentView: function () {
    var colorPickerView = new ColorPicker({
      value: this.model.get('fixed'),
      opacity: this.model.get('opacity'),
      disableOpacity: this._disableOpacity || false
    });

    colorPickerView.bind('change', this._onChangeValue, this);
    return colorPickerView;
  },

  _onClick: function () {
    if (this.options.disabled) {
      return;
    }

    this.model.trigger('click', this);
  },

  _initBinds: function () {
    var self = this;

    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:selected', this._onToggleSelected, this);
    this.model.on('change:opacity', this.render, this);
    this.model.on('change:fixed', this.render, this);
    this.model.on('change:image', this.render, this);
    this.model.on('change:range', this.render, this);
  },

  _getValue: function () {
    var value = this.model.get('fixed');

    if (value) {
      value = Utils.hexToRGBA(value, this._getOpacity());
    }

    return value;
  },

  _getOpacity: function () {
    return this.model.get('opacity') != null ? this.model.get('opacity') : 1;
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  },

  _onChangeValue: function (color) {
    this.model.set({ fixed: color.hex, opacity: color.opacity });
  }
});
