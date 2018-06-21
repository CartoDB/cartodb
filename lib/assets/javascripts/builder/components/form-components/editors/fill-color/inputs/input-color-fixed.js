var _ = require('underscore');
var $ = require('jquery');

var CoreView = require('backbone/core-view');

var ColorPickerView = require('builder/components/color-picker/color-picker');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var InputColorTemplate = require('builder/components/form-components/editors/fill-color/inputs/input-color-fixed.tpl');

var Utils = require('builder/helpers/utils');

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'CDB-OptionInput-item',

  events: {
    'click': '_onClick'
  },

  initialize: function (options) {
    if (this.options.editorAttrs) {
      this._editorAttrs = this.options.editorAttrs;
      this._help = this._editorAttrs.help;
    }

    if (!options.columns) throw new Error('columns is required');

    this._columns = options.columns;
    this._configModel = options.configModel;
    this._userModel = options.userModel;
    this._modals = options.modals;
    this._query = options.query;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.toggleClass('is-disabled', this.options.disabled);

    this.$el.html(
      InputColorTemplate({
        value: this._getValue(),
        opacity: this._getOpacity(),
        help: this._help && this._help.color || null
      })
    );

    this._initViews();

    return this;
  },

  _initViews: function () {
    if (this._help && this._help.color) {
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

  _initBinds: function () {
    var self = this;

    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:selected', this._onToggleSelected, this);
    this.model.on('change:opacity change:fixed', this.render, this);
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _createContentView: function () {
    this._colorPickerView = new ColorPickerView({
      value: this.model.get('fixed'),
      opacity: this.model.get('opacity'),
      disableOpacity: this._disableOpacity || false
    });

    this._initColorPickerViewBindings();

    return this._colorPickerView;
  },

  _initColorPickerViewBindings: function () {
    if (this._colorPickerView) {
      this._colorPickerView.bind('change', this._onChangeValue, this);
      this._colorPickerView.on('onClean', function () {
        this._colorPickerView.unbind('change', this._onChangeValue, this);
      }, this);
    }
  },

  _onClick: function () {
    if (this.options.disabled) {
      return;
    }

    this.trigger('click', this.model);
  },

  _getValue: function () {
    var value = this.model.get('fixed');

    return value
      ? Utils.hexToRGBA(value, this._getOpacity())
      : value;
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
