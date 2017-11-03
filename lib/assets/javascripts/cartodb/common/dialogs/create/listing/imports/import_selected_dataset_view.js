var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var pluralizeString = require('../../../../view_helpers/pluralize_string');

/**
 *  Selected dataset
 *
 *  - Displays the result when a dataset is selected, no matter the type.
 *  - It will show available sync options if that import lets it.
 *  - Upgrade link for people who don't have sync permissions.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'DatasetSelected',

  _FORMATTERS: {
    'size': Utils.readablizeBytes,
    'number': Utils.formatNumber
  },

  options: {
    acceptSync: false,
    fileAttrs: {
      ext: false,
      title: '',
      description: {
        content: [{
          name: 'id',
          format: ''
        }],
        itemName: '',
        separator: ''
      }
    }
  },

  events: {
    'click .js-interval-0': '_onIntervalZero',
    'click .js-interval-1': '_onIntervalHour',
    'click .js-interval-2': '_onIntervalDay',
    'click .js-interval-3': '_onIntervalWeek',
    'click .js-interval-4': '_onIntervalMonth'
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/views/create/listing/import_selected_dataset');
    this._initBinds();
    this._checkVisibility();
  },

  render: function() {
    var title = this.options.fileAttrs.title && this.model.get('value')[this.options.fileAttrs.title] || this.model.get('value');
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '' ;

    if (this.options.fileAttrs.ext) {
      title = title && title.replace('.' + ext, '');
    }

    var upgradeUrl = window.upgrade_url;
    var userCanSync = this.user.get('actions') && this.user.get('actions').sync_tables;
    var customInstall = cdb.config.get('cartodb_com_hosted');

    this.$el.html(
      this.template({
        title: title,
        description: description,
        ext: ext,
        interval: this.model.get('interval'),
        importCanSync: this.options.acceptSync,
        userCanSync: userCanSync,
        showTrial: this.user.canStartTrial(),
        showUpgrade: !userCanSync && !customInstall && upgradeUrl && !this.user.isInsideOrg(),
        upgradeUrl: upgradeUrl
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:value', this.render, this);
    this.model.bind('change:interval', this.render, this);
    this.model.bind('change:state', this._checkVisibility, this);
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

          var value = self.model.get('value')[item.name];
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

  _onIntervalZero: function() {
    this.model.set('interval', 0);
  },

  _onIntervalHour: function() {
    if (this.options.acceptSync && this.user.get('actions').sync_tables) {
      this.model.set('interval', 3600);
    }
  },

  _onIntervalDay: function() {
    if (this.options.acceptSync && this.user.get('actions').sync_tables) {
      this.model.set('interval', 86400);
    }
  },

  _onIntervalWeek: function() {
    if (this.options.acceptSync && this.user.get('actions').sync_tables) {
      this.model.set('interval', 604800);
    }
  },

  _onIntervalMonth: function() {
    if (this.options.acceptSync && this.user.get('actions').sync_tables) {
      this.model.set('interval', 2592000);
    }
  },

  // Change options
  setOptions: function(d) {
    if (d && !_.isEmpty(d)) {
      _.extend(this.options, d);
    }
  },

  _checkVisibility: function() {
    var state = this.model.get('state');
    if (state === 'selected') {
      this.show();
    } else {
      this.hide();
    }
  }

});
