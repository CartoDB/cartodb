var cdb = require('cartodb.js');
var Utils = require('../../../../../../helpers/utils');
var ServiceUtilsFormat = require('./import-service-item-description-format');
var template = require('./import-service-list-item.tpl');
var _ = require('underscore');

/**
 *  Service list item view
 *
 *  - Displays the item info.
 *  - It lets user to select the item for a future import.
 *
 */

module.exports = cdb.core.View.extend({
  options: {
    title: '',
    fileAttrs: {
      ext: false,
      title: 'filename',
      description: 'size',
      itemName: 'file',
      formatDescription: ''
    }
  },

  _FORMATTERS: {
    'size': ServiceUtilsFormat.formatSize,
    'number': Utils.formatNumber
  },

  className: 'ModalBlockList-item ModalBlockList-item--full',
  tagName: 'li',

  events: {
    'click .js-choose': '_onSelectItem'
  },

  render: function () {
    var title = this.model.get(this.options.fileAttrs.title);
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '';

    if (this.options.fileAttrs.ext) {
      title = title && title.replace('.' + ext, '');
    }

    this.$el.html(
      template({
        name: this.options.title,
        ext: ext,
        title: title,
        description: description
      })
    );
    return this;
  },

  _genDescription: function () {
    if (this.options.fileAttrs && this.options.fileAttrs.description) {
      var descriptionOpts = this.options.fileAttrs.description;
      var descriptionKeyValue = '';
      var descriptionStr = '';
      var self = this;

      if (descriptionOpts.content && descriptionOpts.content.length > 0) {
        _.each(descriptionOpts.content, function (item, i) {
          if (i > 0 && descriptionOpts.separator) {
            descriptionStr += ' ' + descriptionOpts.separator + ' ';
          }

          var value = self.model.get(item.name);
          var format = item.format && self._FORMATTERS[item.format];
          descriptionStr += format && format(value) || value;

          if (item.key) {
            descriptionKeyValue = item.name;
          }
        });
      }

      if (descriptionOpts.itemName && descriptionKeyValue) {
        descriptionStr += ' ' + (descriptionOpts.itemName && _t('components.modals.add-layer.imports.' + descriptionOpts.itemName + '-pluralize', { smart_count: descriptionKeyValue }) || '');
      }

      return descriptionStr;
    }

    return '';
  },

  _onSelectItem: function () {
    this.trigger('selected', this.model, this);
  }

});
