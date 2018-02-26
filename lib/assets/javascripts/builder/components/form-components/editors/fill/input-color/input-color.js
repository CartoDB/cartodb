var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./input-color.tpl');
var InputDialogContent = require('./input-color-dialog-content');
var Utils = require('builder/helpers/utils');
var rampList = require('./input-quantitative-ramps/ramps');
var ImageLoaderView = require('builder/components/img-loader-view');
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
      this._imageEnabled = this._editorAttrs.imageEnabled;
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

    var column = this._getColumn();
    var columnType = column && column.type;
    var hasDomain = this.model.get('domain') && this.model.get('domain').length;

    if (this.model.get('range') && _.isString(this.model.get('range'))) {
      this._migrateRange();
    }

    var hasRange = this.model.get('range') && this.model.get('range').length;
    var showCategories = (columnType === 'string') || (hasDomain && hasRange);
    var imageURL = this._getImageURL();
    var categoryImagesPresent = this._iconStylingEnabled() && !this._getImageURL() && this._categoryImagesPresent();

    this.$el.html(template({
      categoryImagesPresent: categoryImagesPresent,
      imageURL: imageURL,
      kind: this._getKind(),
      showCategories: showCategories,
      value: this._getValue(),
      opacity: this._getOpacity(),
      help: this._help || ''
    }));

    this._initViews();

    return this;
  },

  _initViews: function () {
    this.iconView = new ImageLoaderView({
      imageClass: 'Editor-fillImageAsset',
      imageUrl: this._getImageURL(),
      color: this.model.get('fixed')
    });
    this.addView(this.iconView);
    this.$('.js-image-container').append(this.iconView.render().el);

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

  _categoryImagesPresent: function () {
    var images = this.model.get('images');

    for (var i in images) {
      if (!_.isEmpty(images[i])) {
        return true;
      }
    }

    return false;
  },

  _iconStylingEnabled: function () {
    return this._imageEnabled;
  },

  _getKind: function () {
    return this.model.get('kind') && this._iconStylingEnabled() ? this.model.get('kind') : '';
  },

  _getImageURL: function () {
    return this.model.get('image') && this._iconStylingEnabled() ? this.model.get('image') : '';
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
      editorAttrs: this._editorAttrs
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

    this.model.on('change:images', this.render, this);
    this.model.on('change:selected', this._onToggleSelected, this);
    this.model.on('change:opacity', this.render, this);
    this.model.on('change:fixed', this.render, this);
    this.model.on('change:fixed', this._updateColor, this);
    this.model.on('change:image', this.render, this);
    this.model.on('change:range', this.render, this);
  },

  _updateColor: function () {
    this.iconView && this.iconView.updateImageColor(this.model.get('fixed'));
  },

  _getValue: function () {
    var value = this.model.get('fixed');

    if (value) {
      value = Utils.hexToRGBA(value, this._getOpacity());
    }

    if (this.model.get('range') && this.model.get('range').length) {
      value = _.map(this.model.get('range'), function (color) {
        return Utils.hexToRGBA(color, this._getOpacity());
      }, this);
    }

    return value;
  },

  _getOpacity: function () {
    return this.model.get('opacity') != null ? this.model.get('opacity') : 1;
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-active', this.model.get('selected'));
  }
});
