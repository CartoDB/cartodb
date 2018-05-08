var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./input-img.tpl');
var ImageLoaderView = require('builder/components/img-loader-view');
var InputColorFileView = require('builder/components/form-components/editors/fill/input-color/input-color-file-view');
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
    }

    this._imageEnabled = true;
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

    this.$el.html(template({
      help: this._help || '',
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

  _updateColor: function () {
    this.iconView && this.iconView.updateImageColor(this.model.get('fixed'));
  },

  _onClick: function (e) {
    if (this.options.disabled) {
      return;
    }
    this.trigger('click', this.model);
  },

  _createContentView: function () {
    return this._generateFileContentView();
  },

  _generateFileContentView: function () {
    var contentView = new InputColorFileView({
      model: this.model,
      userModel: this._userModel,
      configModel: this._configModel,
      modals: this._modals
    });

    contentView.bind('change', this._onChangeFile, this);
    return contentView;
  },

  _onChangeFile: function (image) {
    this.model.set({ kind: image.kind, image: image.url });
  },

  _initBinds: function () {
    var self = this;
    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:images change:image change:fixed', this.render, this);
    this.model.on('change:fixed', this._updateColor, this);
  },

  _getImageURL: function () {
    return this.model.get('image') && this._iconStylingEnabled() ? this.model.get('image') : '';
  },

  _iconStylingEnabled: function () {
    return this._imageEnabled;
  },

  _getKind: function () {
    return this.model.get('kind') && this._iconStylingEnabled() ? this.model.get('kind') : '';
  }
});
