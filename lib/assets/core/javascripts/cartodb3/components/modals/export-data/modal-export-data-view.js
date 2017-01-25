var $ = require('jquery');
var CoreView = require('backbone/core-view');
var renderLoading = require('../../loading/render-loading');
var ErrorView = require('../../error/error-view');
var template = require('./modal-export-data.tpl');
var MAX_SQL_GET_LENGTH = 1000;
var CSV_FILTER = 'SELECT * FROM (%%sql%%) as subq ';
var FORMATS = [
  {
    format: 'csv',
    fetcher: 'fetchCSV',
    geomRequired: false
  }, {
    format: 'shp',
    fetcher: 'fetch',
    geomRequired: true
  }, {
    format: 'kml',
    fetcher: 'fetch',
    geomRequired: true
  }, {
    format: 'geojson',
    label: 'geo json',
    fetcher: 'fetch',
    geomRequired: true
  }, {
    format: 'svg',
    fetcher: 'fetchSVG',
    geomRequired: true
  }
];

module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-confirm': '_onConfirm',
    'click .js-cancel': '_close'
  },

  options: {
    autoClose: true
  },

  initialize: function (opts) {
    if (!opts.fileName) throw new Error('name is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.modalModel) throw new Error('modalModel is required');

    this._configModel = opts.configModel;
    this._fileName = opts.fileName;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._modalModel = opts.modalModel;

    this._initBinds();

    if (this._queryGeometryModel.get('status') === 'unfetched') {
      this._queryGeometryModel.fetch();
    }
  },

  render: function () {
    var geom = this._queryGeometryModel.get('simple_geom');

    if (this._queryGeometryModel.get('status') === 'fetched' || this._queryGeometryModel.get('status') === 'unavailable') {
      this.$el.html(
        template({
          formats: FORMATS,
          url: this._configModel.getSqlApiUrl(),
          isGeoreferenced: !!geom
        })
      );
    } else {
      this._renderLoadingContent(_t('components.modals.export-data.loading.geometry'));
    }

    return this;
  },

  _initBinds: function () {
    this._queryGeometryModel.bind('change:status', function () {
      if (this._queryGeometryModel.get('status') !== 'unavailable') {
        this.render();
      } else {
        this.showError(_t('components.modals.export-data.error.geometry-error'));
      }
    }, this);
    this.add_related_model(this._queryGeometryModel);
  },

  /**
   * search a format based on its name in the format array
   * @param  {string} format Format name
   * @return {Object}
   */
  _getFormat: function (format) {
    for (var n in FORMATS) {
      if (FORMATS[n].format === format) {
        return FORMATS[n];
      }
    }
  },

  _onConfirm: function () {
    this._form = this.$('.js-form');
    var formatName = $('.js-format[name=format]:checked', this._form).data('format');
    var format = this._getFormat(formatName);

    this[format.fetcher](formatName);
  },

  /**
   * Create a dictionary with the options shared between all the methods
   * @return {Object}
   */
  getBaseOptions: function () {
    return {
      filename: this._fileName,
      apiKey: this._configModel.get('api_key')
    };
  },

  /**
   * Returns a specific sql filtered by the_geom, used on CSV exports
   * @return {string}
   */
  getGeomFilteredSql: function () {
    var sql = this._queryGeometryModel.get('query');
    var geom = this._queryGeometryModel.get('simple_geom');

    // if we have "the_geom" in our current schema, we apply a custom sql
    if (geom) {
      return CSV_FILTER.replace(/%%sql%%/g, sql);
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
    this.$('.js-format').val(options.format);
    this.$('.js-q').val(sql);
    this.$('.js-filename').val(options.filename);
    this.$('.js-apiKey').val(options.apiKey);

    var skipFields = ['the_geom_webmercator'];
    if (options.format !== 'csv') {
      skipFields.push('the_geom');
    }
    this.$('.js-skipfields').val(skipFields.join(','));

    // TODO: track metrics

    // check if the sql is big or not, and send the request as a verb or other. This is a HACK.
    if (sql.length < MAX_SQL_GET_LENGTH) {
      var location = this.$('.js-form').attr('action') + '?' + this.$('.js-form').serialize();
      this._fetchGET(location);
    } else {
      // I can't find a way of making the iframe trigger load event when its get a form posted,
      // so we need to leave like it was until
      this.submit();
    }

    this.$('.js-skipfields').attr('disabled', 'disabled');

    if (this.options.autoClose) {
      this._close();
    } else {
      this._renderLoadingContent(_t('components.modals.export-data.loading.preparing'));
    }
  },

  showError: function (errorMessage) {
    var errorView = new ErrorView({
      title: _t('hello'),
      desc: errorMessage
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
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
          error = _t('components.modals.export-data.error.unknown');
        }
      }
      return error;
    }

    var self = this;
    var checkInterval;

    var w = window.open(url);
    w.onload = function () {
      clearInterval(checkInterval);
      var error = getError(w.document.body.textContent);
      if (error) {
        self.showError(error);
      } else {
        self._close();
      }
      w.close();
    };
    window.focus();
    checkInterval = setInterval(function check () {
      // safari needs to check the body because it never
      // calls onload
      if (w.closed || (w.document && w.document.body.textContent.length === 0)) {
        self._close();
        clearInterval(checkInterval);
      }
    }, 100);
  },

  /**
   * Base fetch, for the formats that don't require special threatment
   * @param  {String} formatName
   */
  fetch: function (formatName) {
    var options = this.getBaseOptions();
    options.format = formatName;
    var sql = this._queryGeometryModel.get('query');
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
    this.$('.js-skipfields').removeAttr('disabled');
    this._fetch(options, sql);
  },
  /**
   * Gets the options needed for svg format and fetch the document
   * @param  {String} formatName
   */
  fetchSVG: function () {
    this.fetch('svg');
  },

  /**
   * Submits the form. This method is separated to ease the testing
   */
  submit: function () {
    this.$('.js-form').submit();
  },

  _renderLoadingContent: function (title) {
    this.$el.html(
      renderLoading({
        title: title
      })
    );
  },

  _close: function () {
    this._modalModel.destroy();
  }

});
