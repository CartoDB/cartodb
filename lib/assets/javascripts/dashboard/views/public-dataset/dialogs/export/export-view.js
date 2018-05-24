const _ = require('underscore');
const $ = require('jquery');
const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const failTemplate = require('dashboard/components/fail.tpl');

const REQUIRED_OPTS = [
  'configModel',
  'modalModel'
];

/**
 * shows a dialog to get the table exported
 * new ExportDialog({
 *  table: table_model
 * })
 *
 * (Migrated almost-as-is from old editor to not break functionality)
 */
module.exports = CoreView.extend({

  _CSV_FILTER: 'SELECT * FROM (%%sql%%) as subq ',
  _MAX_SQL_GET_LENGTH: 1000,
  events: {
    'click .js-option:not(.is-disabled)': '_export',
    'click .js-cancel': '_closeDialog'
  },

  /**
   * Allowed formats on the exporter
   * @type {Array}
   */
  formats: [
    { format: 'csv', fetcher: 'fetchCSV', geomRequired: false, illustrationIconModifier: 'IllustrationIcon--neutral' },
    { format: 'shp', fetcher: 'fetch', geomRequired: true, illustrationIconModifier: 'IllustrationIcon--magenta' },
    { format: 'kml', fetcher: 'fetch', geomRequired: true, illustrationIconModifier: 'IllustrationIcon--sunrise' },
    { format: 'geojson', label: 'geo json', fetcher: 'fetch', geomRequired: true, illustrationIconModifier: 'IllustrationIcon--cyan' },
    { format: 'svg', fetcher: 'fetchSVG', geomRequired: true, illustrationIconModifier: 'IllustrationIcon--royalDark' }
  ],

  initialize: function () {
    checkAndBuildOpts(this.options, REQUIRED_OPTS, this);
    _.extend(this.options, {
      clean_on_hide: true,
      table_id: this.model.id
    });
    _.bindAll(this, '_export');
    this.baseUrl = this._configModel.getSqlApiUrl();
    this.model.bind('change:geometry_types', this.refresh, this);
  },

  /**
   * search a format based on its name in the format array
   * @param  {string} format Format name
   * @return {Object}
   */
  getFormat: function (format) {
    for (var n in this.formats) {
      if (this.formats[n].format === format) {
        return this.formats[n];
      }
    }
  },

  /**
   * Answer to button event and lauchn the export method associated to that format
   * @param  {Event} ev
   */
  _export: function (ev) {
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
    throw new Error('Method not migrated, only used in subclass');
  },

  /**
   * Returns a specific sql filtered by the_geom, used on CSV exports
   * @return {string}
   */
  getGeomFilteredSql: function () {
    var sql = this.getPlainSql();
    // if we have "the_geom" in our current schema, we apply a custom sql
    if (this.model.isGeoreferenced()) {
      return this._CSV_FILTER.replace(/%%sql%%/g, sql);
    }
    // Otherwise, we apply regular sql
    return sql;
  },

  /**
   * Populates the hidden form with the format related values and submits them to get the file
   * @param  {Object} options Base options
   * @param  {String} sql Sql of the document to be retrieved
   */
  _fetch: function (options, sql) {
    this._showElAndHideRest('.js-preparing-download');
    this.$('.format').val(options.format);
    this.$('.q').val(sql);
    this.$('.filename').val(options.filename);
    this.$('.api_key').val(options.api_key);

    if (options.format === 'csv') {
      this.$('.skipfields').val('the_geom_webmercator');
    } else {
      this.$('.skipfields').val('the_geom,the_geom_webmercator');
    }

    // check if the sql is big or not, and send the request as a verb or other. This is a HACK.
    if (sql.length < this._MAX_SQL_GET_LENGTH) {
      var location = this.$('form').attr('action') + '?' + this.$('form').serialize();
      this._fetchGET(location);
    } else {
      // I can't find a way of making the iframe trigger load event when its get a form posted,
      // so we need to leave like it was until
      this.submit();
    }

    this.$('.db').attr('disabled', 'disabled');
    this.$('.skipfields').attr('disabled', 'disabled');

    if (this.options.autoClose) {
      this.close();
      this.trigger('generating', this.$('.js-preparing-download').html());
    }
  },

  showError: function (error) {
    this.$('.js-error').html(
      failTemplate({
        msg: error
      })
    );
    this._showElAndHideRest('.js-error');
  },

  _fetchGET: function (url) {
    function getError (content) {
      // sql api returns a json when it fails
      // but if the browser is running some plugin that
      // formats it, the window content is the html
      // so search for the word "error"
      var error = null;
      try {
        var json = JSON.parse(content);
        error = json.error[0];
      } catch (e) {
        if (content && content.indexOf('error') !== -1) {
          error = 'an error occurred';
        }
      }
      return error;
    }

    var checkInterval;

    var w = window.open(url);
    w.onload = () => {
      clearInterval(checkInterval);
      var error = getError(w.document.body.textContent);
      if (error) {
        this.showError(error);
      } else {
        this._modalModel.destroy();
      }
      w.close();
    };
    window.focus();
    checkInterval = setInterval(() => {
      // safari needs to check the body because it never
      // calls onload
      if (w.closed || (w.document && w.document.body.textContent.length === 0)) {
        this._modalModel.destroy();
        clearInterval(checkInterval);
      }
    }, 100);
  },

  /**
   * Submits the form. This method is separated to ease the testing
   */
  submit: function () {
    this.$('form').submit();
  },

  /**
   * Base fetch, for the formats that don't require special threatment
   * @param  {String} formatName
   */
  fetch: function (formatName) {
    var options = this.getBaseOptions();
    options.format = formatName;
    var sql = this.getPlainSql();
    this._fetch(options, sql);
  },

  /**
   * Gets the options needed for csv format and fetch the document
   * @param  {String} formatName
   */
  fetchCSV: function () {
    var options = this.getBaseOptions();
    options.format = 'csv';
    var sql = this.getGeomFilteredSql();
    this.$('.skipfields').removeAttr('disabled');
    this._fetch(options, sql);
  },
  /**
   * Gets the options needed for svg format and fetch the document
   * @param  {String} formatName
   */
  fetchSVG: function () {
    this.$('.db').removeAttr('disabled');
    this.fetch('svg');
  },
  /**
   * Formerly render_content
   * Returns the html populated with current data
   * @return {String}
   */
  render: function () {
    throw new Error('Method not migrated, only used in subclass');
  },

  refresh: function () {
    this.$('.content').html(this.render_content());
  },

  _renderLoadingContent: function (title) {
    return loadingTemplate({
      title: title,
      descHTML: randomQuote()
    });
  },

  _showElAndHideRest: function (classNameToShow) {
    [
      '.js-start',
      '.js-preparing-download',
      '.js-error'
    ].forEach(function (className) {
      this.$(className)[ className === classNameToShow ? 'show' : 'hide' ]();
    }, this);
  }

});
