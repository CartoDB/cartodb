var _ = require('underscore');
var $ = require('jquery');

var CoreView = require('backbone/core-view');

var InputColorValueContentView = require('builder/components/form-components/editors/fill/input-color/input-color-value-content-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var InputColorTemplate = require('builder/components/form-components/editors/fill-color/inputs/input-color-by-value.tpl');
var FillConstants = require('builder/components/form-components/_constants/_fill');

var Utils = require('builder/helpers/utils');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'columns',
  'query',
  'configModel',
  'userModel',
  'modals'
];

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
      this._imageEnabled = this.options.imageEnabled;

      if (this._editorAttrs.hidePanes && !_.contains(this._editorAttrs.hidePanes, FillConstants.Panes.VALUE)) {
        if (!options.configModel) throw new Error('configModel param is required');
        if (!options.userModel) throw new Error('userModel param is required');
        if (!options.modals) throw new Error('modals param is required');
        if (!options.query) throw new Error('query param is required');
      }
    }

    if (!options.columns) throw new Error('columns is required');

    checkAndBuildOpts(options, REQUIRED_OPTS, this);

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
        help: this._help || ''
      })
    );

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

  _initBinds: function () {
    var self = this;

    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:selected', this._onToggleSelected, this);
    this.model.on('change:opacity change:range', this.render, this);
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _iconStylingEnabled: function () {
    return this._imageEnabled;
  },

  _createContentView: function () {
    this._inputColorValueContentView = new InputColorValueContentView({
      model: this.model,
      columns: this._columns,
      configModel: this._configModel,
      categorizeColumns: this._categorizeColumns,
      imageEnabled: this._imageEnabled,
      userModel: this._userModel,
      modals: this._modals,
      hideTabs: this._hideTabs,
      query: this._query
    });

    this.model.on('change', this._onChangeValue, this);

    return this._inputColorValueContentView;
  },

  _onClick: function () {
    if (this.options.disabled) {
      return;
    }

    this.trigger('click', this.model);
  },

  _getValue: function () {
    return this.model.get('range') && this.model.get('range').length
      ? this._getRangeColorValues()
      : null;
  },

  _getRangeColorValues: function () {
    return _.map(this.model.get('range'), function (color) {
      return Utils.hexToRGBA(color, this._getOpacity());
    }, this);
  },

  _getOpacity: function () {
    return this.model.get('opacity') != null ? this.model.get('opacity') : 1;
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  },

  _onChangeValue: function (color) {
    this.model.set({ quantification: color.get('quantification'), range: color.get('range') });
  }
});
