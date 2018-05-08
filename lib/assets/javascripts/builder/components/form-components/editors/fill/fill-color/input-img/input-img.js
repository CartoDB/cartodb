var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./input-img.tpl');
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
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.html(template({
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

  _updateColor: function () {
    this.iconView && this.iconView.updateImageColor(this.model.get('fixed'));
  },

  _onClick: function (e) {
    if (this.options.disabled) {
      return;
    }
    this.trigger('click', this.model);
  },

  _initBinds: function () {
    this.model.on('change:images', this.render, this);
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
