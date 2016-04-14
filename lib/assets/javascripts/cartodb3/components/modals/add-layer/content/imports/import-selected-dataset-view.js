var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var Utils = require('../../../../../helpers/utils');
var template = require('./import-selected-dataset.tpl');

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

  initialize: function (opts) {
    if (!opts.userModel) throw new TypeError('userModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._initBinds();
    this._checkVisibility();
  },

  render: function () {
    var title = this.options.fileAttrs.title && this.model.get('value')[this.options.fileAttrs.title] || this.model.get('value');
    var description = this._genDescription();
    var ext = this.options.fileAttrs.ext ? Utils.getFileExtension(title) : '';

    if (this.options.fileAttrs.ext) {
      title = title && title.replace('.' + ext, '');
    }

    var upgradeUrl = window.upgrade_url;
    var userCanSync = this._userModel.isActionEnabled('sync_tables');
    var customInstall = this._configModel.get('cartodb_com_hosted');

    this.$el.html(
      template({
        title: title,
        description: description,
        ext: ext,
        interval: this.model.get('interval'),
        importCanSync: this.options.acceptSync,
        userCanSync: userCanSync,
        showTrial: this._userModel.canStartTrial(),
        showUpgrade: !userCanSync && !customInstall && upgradeUrl && !this._userModel.isInsideOrg(),
        upgradeUrl: upgradeUrl
      })
    );
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:value', this.render, this);
    this.model.bind('change:interval', this.render, this);
    this.model.bind('change:state', this._checkVisibility, this);
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

          var value = self.model.get('value')[item.name];
          var format = item.format && self._FORMATTERS[item.format];
          descriptionStr += format && format(value) || value;

          if (item.key) {
            descriptionKeyValue = item.name;
          }
        });
      }

      if (descriptionOpts.itemName && descriptionKeyValue) {
        descriptionStr += ' ' + (descriptionOpts.itemName && _t('components.modals.add-layer.imports.' + descriptionOpts.itemName + '-pluralize', { smart_count: descriptionKeyValue}) || '');
      }

      return descriptionStr;
    }

    return '';
  },

  _onIntervalZero: function () {
    this.model.set('interval', 0);
  },

  _onIntervalHour: function () {
    if (this.options.acceptSync && this._userModel.isActionEnabled('sync_tables')) {
      this.model.set('interval', 3600);
    }
  },

  _onIntervalDay: function () {
    if (this.options.acceptSync && this._userModel.isActionEnabled('sync_tables')) {
      this.model.set('interval', 86400);
    }
  },

  _onIntervalWeek: function () {
    if (this.options.acceptSync && this._userModel.isActionEnabled('sync_tables')) {
      this.model.set('interval', 604800);
    }
  },

  _onIntervalMonth: function () {
    if (this.options.acceptSync && this._userModel.isActionEnabled('sync_tables')) {
      this.model.set('interval', 2592000);
    }
  },

  setOptions: function (d) {
    if (d && !_.isEmpty(d)) {
      _.extend(this.options, d);
    }
  },

  _checkVisibility: function () {
    var state = this.model.get('state');
    if (state === 'selected') {
      this.show();
    } else {
      this.hide();
    }
  }

});
