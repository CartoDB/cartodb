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
      imageClass: 'Tab-paneLabelImage'
    });
  },

  render: function () {
    this.clearSubViews();

    var labelType = this._getLabelType();

    this.$el.html(template({
      type: labelType,
      label: this.model.get('label'),
      kind: this.model.get('kind'),
      selectedChild: this.model.get('selectedChild') || ''
    }));

    if (labelType === 'file') {
      this._loadImage(this._getImageURL(), this.model.get('color'));
    }

    return this;
  },

  _updateColor: function () {
    this._updateImageColor(this.model.get('color'));
  },

  _getLabelType: function () {
    var label = this.model.get('label');
    return label && label.match(/^http/) ? 'file' : 'text';
  },

  _getImageURL: function () {
    return this.model.get('label');
  }
});
