var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var template = require('./modal-export-data.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');

var FormatView = require('./modal-export-data-format-view');

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
  }, {
    format: 'gpkg',
    fetcher: 'fetch',
    geomRequired: true
  }
];

var REQUIRED_OPTS = [
  'configModel',
  'queryGeometryModel',
  'querySchemaModel',
  'canHideColumns',
  'modalModel',
  'fromView'
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
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._layerModel = opts.layerModel;
    this._filename = opts.filename;

    this._initBinds();

    if (this._queryGeometryModel.get('status') === 'unfetched') {
      this._queryGeometryModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._queryGeometryModel.get('status') === 'fetched' || this._queryGeometryModel.get('status') === 'unavailable') {
      this._renderFormats();
    } else {
      this._renderLoadingContent(_t('components.modals.export-data.loading.geometry'));
    }

    return this;
  },

  _renderFormats: function () {
    var geometry = this._queryGeometryModel.get('simple_geom');
    var isGeoreferenced = !!geometry;

    this.$el.html(
      template({
        isGeoreferenced: isGeoreferenced,
        url: this._configModel.getSqlApiUrl()
      })
    );

    var isChecked = true;

    _.each(FORMATS, function (format) {
      var isDisabled = (isGeoreferenced === false && format.geomRequired === true);
      if (isGeoreferenced === true && format.geomRestricted != null && !isDisabled) {
        isDisabled = !_.contains(format.geomRestricted, geometry);
      }

      this._renderFormat(format, isDisabled, !isDisabled && isChecked);

      if (!isDisabled) {
        isChecked = false;
      }
    }, this);
  },

  _renderFormat: function (format, isDisabled, isChecked) {
    var view = new FormatView({
      format: format,
      isDisabled: isDisabled,
      isChecked: isChecked
    });

    this.$('.js-formats').append(view.render().el);
    this.addView(view);
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

    if (this._layerModel) {
      MetricsTracker.track(MetricsTypes.DOWNLOADED_LAYER, {
        format: formatName,
        layer_id: this._layerModel.get('id'),
        source: this._layerModel.get('source'),
        visible: this._layerModel.get('visible'),
        table_name: this._layerModel.get('table_name'),
        from_view: this._fromView
      });
    }

    this[format.fetcher](formatName);
  },

  /**
   * Create a dictionary with the options shared between all the methods
   * @return {Object}
   */
  getBaseOptions: function () {
    return {
      filename: this._filename,
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

    // We remove the center column only if there's a time buffer analysis on this layer
    // and not a deprecated SQL function analysis. Time buffer always adds this column, but
    // a SQL analysis might add arbitrary columns.
    if (this._canHideColumns) {
      const columnNames = this._querySchemaModel.getColumnNames();
      // Skip column center if it's of type geometry
      if (columnNames.indexOf('center') !== -1 && this._querySchemaModel.getColumnType('center') === 'geometry') {
        skipFields.push('center');
      }
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
