var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils');
var ServiceUtilsFormat = require('./service_item_description_format');
var pluralizeString = require('../../../../../view_helpers/pluralize_string');

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

  className: 'ServiceList-item',
  tagName: 'li',

  events: {
    'click .js-choose': '_onSelectItem'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/service_list_item');
  },

  render: function() {
    var title = this.model.get(this.options.fileAttrs.title);
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '' ;

    if (this.options.fileAttrs.ext) {
      title = title && title.replace('.' + ext, '');
    }

    this.$el.html(
      this.template({
        name: this.options.title,
        ext: ext,
        title: title,
        description: description
      })
    );
    return this;
  },

  _genDescription: function() {
    if (this.options.fileAttrs && this.options.fileAttrs.description) {
      var descriptionOpts = this.options.fileAttrs.description;
      var descriptionKeyValue = '';
      var descriptionStr = '';
      var self = this;

      if (descriptionOpts.content && descriptionOpts.content.length > 0) {
        _.each(descriptionOpts.content, function(item, i) {

          if (i > 0 && descriptionOpts.separator) {
            descriptionStr += " " + descriptionOpts.separator + ' ';
          }

          var value = self.model.get(item.name);
          var format = item.format && self._FORMATTERS[item.format];
          descriptionStr += format && format(value) || value;

          if (item.key) {
            descriptionKeyValue = item.name;
          }
        })
      }

      if (descriptionOpts.itemName && descriptionKeyValue) {
        descriptionStr += ' ' + (descriptionOpts.itemName && pluralizeString(descriptionOpts.itemName, descriptionKeyValue) || '');
      }

      return descriptionStr;
    }

    return '';
  },

  _onSelectItem: function() {
    this.trigger('selected', this.model, this);
  }

});
