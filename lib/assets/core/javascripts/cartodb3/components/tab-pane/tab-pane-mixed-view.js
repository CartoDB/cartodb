var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./tab-pane-file.tpl');
var ImageLoaderView = require('../img-loader-view');

/**
 *  File component
 */

module.exports = ImageLoaderView.extend({
  tagName: 'i',

  className: 'CDB-IconFont',

  initialize: function (options) {
    if (!this.model) throw new Error('A model should be provided');

    this.model.bind('change:label', this.render, this);
    this.model.bind('change:color', this._updateColor, this);

    ImageLoaderView.prototype.initialize.call(this, {
      imageClass: 'Tab-paneLabel-image'
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      type: this._getType(),
      label: this.model.get('label'),
      selectedChild: this.model.get('selectedChild') || ''
    }));

    if (this._getType() === 'file') {
      this._loadImage(this._getImageURL(), this.model.get('color'));
    }

    return this;
  },

  _updateColor: function () {
    this._updateImageColor(this.model.get('color'));
  },

  _getType: function () {
    return this.model.get('label') && this.model.get('label').match(/^http/) ? 'file' : 'text';
  },

  _getImageURL: function () {
    return this.model.get('label');
  }
});
