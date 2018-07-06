var _ = require('underscore');
var $ = require('jquery');

var CoreView = require('backbone/core-view');

var InputImageTemplate = require('./input-image.tpl');
var ImageLoaderView = require('builder/components/img-loader-view');
var InputColorFileView = require('builder/components/input-color/input-color-file-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
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

    this._imageEnabled = true;
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

    this.$el.html(InputImageTemplate({
      help: this._help.image || '',
      image: this.model.get('image'),
      isCustomMarker: this.model.get('kind') === 'custom-marker'
    }));

    this._initViews();

    return this;
  },

  _initViews: function () {
    this.iconView = new ImageLoaderView({
      imageClass: 'Editor-fillImageAsset',
      imageUrl: this._getImageURL(),
      color: this._getColor()
    });

    this.addView(this.iconView);
    this.$('.js-image-container').append(this.iconView.render().el);

    if (this._help.image) {
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

    this.model.on('change:images change:image', this.render, this);
    this.model.on('change:opacity change:fixed', this._updateImageColor, this);
  },

  _categoryImagesPresent: function () {
    var images = this.model.get('images');

    images.forEach(function (image) {
      if (!_.isEmpty(image)) return true;
    });

    return false;
  },

  _updateImageColor: function () {
    if (this.iconView) {
      this.iconView.updateImageColor(this._getColor());
    }
  },

  _getColor: function () {
    var color = this.model.get('fixed');

    return color
      ? Utils.hexToRGBA(color, this._getOpacity())
      : color;
  },

  _getOpacity: function () {
    return this.model.get('opacity') != null ? this.model.get('opacity') : 1;
  },

  _onClick: function () {
    if (this.options.disabled) {
      return;
    }

    this.trigger('click', this.model);
  },

  _onChangeFile: function (marker) {
    var kind, image;

    if (marker) {
      kind = marker.kind;
      image = marker.url;
    } else {
      kind = null;
      image = null;
    }

    this.model.set({ kind: kind, image: image });
  },

  _createContentView: function () {
    this._inputColorFileView = new InputColorFileView({
      model: this.model,
      userModel: this._userModel,
      configModel: this._configModel,
      modals: this._modals
    });

    this._initInputColorFileViewBindings();

    return this._inputColorFileView;
  },

  _initInputColorFileViewBindings: function () {
    if (this._inputColorFileView) {
      this._inputColorFileView.bind('change', this._onChangeFile, this);
      this._inputColorFileView.on('onClean', function () {
        this._inputColorFileView.unbind('change', this._onChangeFile, this);
      }, this);
    }
  },

  _getImageURL: function () {
    return this.model.get('image') && this._isIconStylingEnabled() ? this.model.get('image') : '';
  },

  _getKind: function () {
    return this.model.get('kind') && this._isIconStylingEnabled() ? this.model.get('kind') : '';
  },

  _isIconStylingEnabled: function () {
    return this._imageEnabled;
  }
});
