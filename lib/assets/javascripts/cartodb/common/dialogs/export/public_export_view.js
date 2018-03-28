var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ExportView = require('./export_view');

/**
 *  Shows a dialog to get the public table exported
 *
 *  new PublicExportView({
 *    table: table_model
 *  })
 *
 */
module.exports = ExportView.extend({

  // Events have to be extended from export view parent
  events: {
    'click .js-option:not(.is-disabled)': '_export',
    'click .js-bounds': '_changeBounds',
    'click .cancel': '_cancel',
    'click .close': '_cancel'
  },

  initialize: function () {
    this.elder('initialize');
    this.model.set('bounds', this.options.bounds);
    this.model.bind('change:bounds', this._setBoundsCheckbox, this);
  },

  _changeBounds: function () {
    this.model.set('bounds', !this.model.get('bounds'));
  },

  _setBoundsCheckbox: function () {
    this.$('.js-bounds .Checkbox-input').toggleClass('is-checked', !!this.model.get('bounds'));
  },

  /**
   * Toggle the bounds option to download the intersect or all the geometries
   * @param  {Event} ev
   */
  _toggleBounds: function (ev) {
    this.killEvent(ev);
    var $button = $(ev.currentTarget);
    var formatName = $button.data('format');
    var format = this.getFormat(formatName);
    this[format.fetcher](formatName);
  },

  /**
   * Create a dictionary with the options shared between all the methods
   * @return {Object}
   */
  getBaseOptions: function () {
    var options = {};
    options.filename = this.model.get('name');

    // Keep dataset part in user.dataset names
    if (options.filename.indexOf('.') != -1) {
      options.filename = options.filename.split('.')[1];
    }

    if (this.options.user_data) {
      options.api_key = this.options.user_data.api_key;
    }

    return options;
  },

  /**
   * Returns the base sql to retrieve the data
   * @return {string}
   */
  getPlainSql: function () {
    if (this.options.sql) {
      sql = this.options.sql;
    } else {
      if (this.model.sqlView && this.model.get('bounds')) {
        sql = this.model.sqlView.getSQL();
      } else {
        sql = 'select * from ' + this.model.get('name');
      }
    }
    return sql;
  },

  /**
   * Returns the html populated with current data
   * @return {String}
   */
  render_content: function () {
    var isGeoreferenced = this.model.isGeoreferenced();
    var hasBounds = this.model.get('bounds');

    if (_.isBoolean(isGeoreferenced)) {
      return this.getTemplate('common/dialogs/export/public_export_template')({
        preparingDownloadContent: this._renderLoadingContent('We are preparing your download. Depending on the size, it could take some time.'),
        formats: this.formats,
        url: this.baseUrl,
        isGeoreferenced: isGeoreferenced,
        hasBounds: hasBounds
      });
    } else {
      return this._renderLoadingContent('Checking georeferences…');
    }
  }

});
