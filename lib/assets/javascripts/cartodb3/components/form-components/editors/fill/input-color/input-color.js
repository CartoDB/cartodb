var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./input-color.tpl');
var InputDialogContent = require('./input-color-dialog-content');
var Utils = require('../../../../../helpers/utils');
var rampList = require('./input-ramps/ramps');

module.exports = CoreView.extend({
  tagName: 'li',
  className: 'CDB-OptionInput-item',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (this.options.editorAttrs) {
      this._imageEnabled = this.options.editorAttrs.imageEnabled;

      if (this.options.editorAttrs.hidePanes) {
        var hidePanes = this.options.editorAttrs.hidePanes;
        if (!_.contains(hidePanes, 'value')) {
          if (!opts.configModel) throw new Error('configModel param is required');
          if (!opts.userModel) throw new Error('userModel param is required');
          if (!opts.modals) throw new Error('modals param is required');
          if (!opts.query) throw new Error('query param is required');
        }
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

    var column = this._getColumn();
    var columnType = column && column.type;
    var hasDomain = this.model.get('domain') && this.model.get('domain').length;

    if (this.model.get('range') && _.isString(this.model.get('range'))) {
      this._migrateRange();
    }

    var hasRange = this.model.get('range') && this.model.get('range').length;

    var showCategories = (columnType === 'string') || (hasDomain && hasRange);

    this.$el.html(template({
      imageURL: this._imageEnabled && this.model.get('image') && this._userModel.featureEnabled('icon-styling') ? this.model.get('image') : '',
      showCategories: showCategories,
      value: this._getValue(),
      opacity: this.model.get('opacity')
    }));

    return this;
  },

  // Converts reference to the old color ramp to the full color list
  _migrateRange: function () {
    var rangeName = this.model.get('range');
    var bins = this.model.get('bins') || 3;

    if (rampList[rangeName] && rampList[rangeName][bins]) {
      this.model.set('range', rampList[rangeName][bins]);
    }
  },

  _getColumn: function () {
    return _.find(this._columns, function (column) {
      return column.label === this.model.get('attribute');
    }, this);
  },

  _createContentView: function () {
    var view = new InputDialogContent({
      configModel: this._configModel,
      userModel: this._userModel,
      modals: this._modals,
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
    this.model.on('change:image', this.render, this);
    this.model.on('change:range', this.render, this);
  },

  _getValue: function () {
    var value = this.model.get('fixed');

    if (value) {
      value = Utils.hexToRGBA(value, this.model.get('opacity'));
    }

    if (this.model.get('range') && this.model.get('range').length) {
      value = this.model.get('range');
    }

    return value;
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  }
});
