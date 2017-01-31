var template = require('./tab-pane-file.tpl');
var CoreView = require('backbone/core-view');
var ImageLoaderView = require('../img-loader-view');

/**
 *  File component
 */

module.exports = CoreView.extend({
  tagName: 'i',

  className: 'CDB-IconFont',

  initialize: function (options) {
    if (!this.model) throw new Error('A model should be provided');

    this.model.bind('change:label', this.render, this);
    this.model.bind('change:color', this._updateColor, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      type: this._getType(),
      label: this.model.get('label'),
      selectedChild: this.model.get('selectedChild') || ''
    }));

    if (this._getType() === 'file') {
      this._loadImages();
    }

    return this;
  },

  _loadImages: function () {
    this.iconView = new ImageLoaderView({
      imageClass: 'Tab-paneLabelImage',
      imageUrl: this._getImageURL(),
      color: this.model.get('color')
    });
    this.addView(this.iconView);
    this.$('.js-image-container').append(this.iconView.render().el);
  },

  _updateColor: function () {
    this.iconView.updateImageColor(this.model.get('color'));
  },

  _getType: function () {
    return this.model.get('label') && this.model.get('label').match(/^http/) ? 'file' : 'text';
  },

  _getImageURL: function () {
    return this.model.get('label');
  }
});
