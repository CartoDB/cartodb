
/**
 * shows a dialog to get the table exported
 * new ExportTableDialog({
 *  table: table_model
 * })
 *
 */
cdb.admin.ExportTableDialog = cdb.admin.BaseDialog.extend({

  // _CSV_FILTER: "SELECT *, CASE WHEN GeometryType(the_geom)='POINT' THEN ST_X(the_geom) ELSE ST_X(ST_PointOnSurface(the_geom)) END as longitude, CASE WHEN GeometryType(the_geom)='POINT' THEN ST_Y(the_geom) ELSE ST_Y(ST_PointOnSurface(the_geom)) END as latitude, ST_AsGeoJSON(the_geom,5) as geojson FROM (%%sql%%) as subq",
  _CSV_FILTER: "SELECT *, CASE WHEN GeometryType(the_geom)='POINT' THEN ST_X(the_geom) WHEN ST_IsEmpty(ST_PointOnSurface(the_geom)) THEN null ELSE ST_X(ST_PointOnSurface(the_geom)) END as longitude, CASE WHEN GeometryType(the_geom)='POINT' THEN ST_Y(the_geom) WHEN ST_IsEmpty(ST_PointOnSurface(the_geom)) THEN null ELSE ST_Y(ST_PointOnSurface(the_geom)) END as latitude, ST_AsGeoJSON(the_geom,5) as geojson FROM (%%sql%%) as subq ",
  events: cdb.core.View.extendEvents({
    'click .export:not(.disabled)': 'export'
  }),

  /**
   * Allowed formats on the exporter
   * @type {Array}
   */
  formats: [
    {format: 'csv', fetcher: 'fetchCSV', geomRequired: false},
    {format: 'shp', fetcher: 'fetch', geomRequired: true},
    {format: 'kml', fetcher: 'fetch', geomRequired: true},
    {format: 'svg', fetcher: 'fetchSVG', geomRequired: true},
    {format: 'geojson', fetcher: 'fetch', geomRequired: true}
  ],

  dataGeoreferenced: null,

  initialize: function() {
    _.extend(this.options, {
      title: "Select your file type",
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "",
      modal_type: "",
      width: 510,
      modal_class: 'export_table_dialog',
      include_footer: false,
      table_id: this.model.id
    });
    this.constructor.__super__.initialize.apply(this);
    _.bindAll(this, 'export');
    this.baseUrl = this.options.config.sql_api_protocol + '://' + this.options.config.sql_api_domain
      + ':'
      + this.options.config.sql_api_port
      + '/api/v1/sql';
    this.checkGeoreference();
  },

  checkGeoreference: function() {
    var self = this;
    self.dataGeoreferenced = null;

    this.model.fetchGeoreferenceQueryStatus().done(function(res) {
      self.dataGeoreferenced = res;
      self.refresh();
    }).fail(function(res) {
      // handle error
    })

  },

  /**
   * search a format based on its name in the format array
   * @param  {string} format Format name
   * @return {Object}
   */
  getFormat: function(format) {
    for(var n in this.formats) {
      if(this.formats[n].format === format) {
        return this.formats[n]
      }
    }
  },

  /**
   * Answer to button event and lauchn the export method associated to that format
   * @param  {Event} ev
   */
  export: function(ev) {
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
  getBaseOptions: function() {
    var options = {}
    options.filename = this.model.get('name');
    if(this.model.sqlView) {
      options.filename = 'cartodb_query';
    }

    if(this.options.user_data) {
      options.api_key = this.options.user_data.api_key;
    }
    return options;
  },

  /**
   * Returns the base sql to retrieve the data
   * @return {string}
   */
  getPlainSql: function() {
    if(this.options.sql) {
      sql = this.options.sql;
    } else {
      if(this.model.sqlView) {
        sql = this.model.sqlView.getSQL();
      } else {
        sql = "select * from " + this.model.get('name')
      }
    }
    return sql;
  },

  /**
   * Returns a specific sql filtered by the_geom, used on CSV exports
   * @return {string}
   */
  getGeomFilteredSql: function() {
    var sql = this.getPlainSql();
    var currentSchema = this.model.get('schema');
    // if we have "the_geom" in our current schema, we apply a custom sql
    if(this.dataGeoreferenced) {
      return this._CSV_FILTER.replace(/%%sql%%/g, sql);
    } // if not, we apply regular sql
    return sql;

  },

  /**
   * Populates the hidden form with the format related values and submit them to get the file
   * @param  {Object} options Base options
   * @param  {String} sql Sql of the document to be retrieved
   */
  _fetch: function(options, sql) {
    var self = this;
    this.$('.format').val(options.format);
    this.$('.q').val(sql);
    this.$('.filename').val(options.filename);
    this.$('.api_key').val(options.api_key);
    this.$('.generating').fadeIn();
    this.$('.geospatial').fadeOut();
    // check if the sql is big or not, and send the request as a verb or other. This is a HACK.
    if(sql.length < 1000) {
      var location = this.$('form').attr('action') + '?' + this.$('form').serialize()
      var fetcher = $('<iframe id="fetchHack" src="'+location+'" onload="fetcherSuccess();"/>');
      // I'll burn in hell for this. I'm worst than hitler.
      window.fetcherSuccess = function() {
        this.exportDialog.hide();
        setTimeout($('iframe#fetchHack').remove,25);
      };
      window.fetcherSuccess.exportDialog = this;

      fetcher.css('display', 'none');
      fetcher.appendTo($('body'))
    } else {
      // I can't find a way of making the iframe trigger load event when its get a form posted,
      // so we need to leave like it was until now
      this.submit();
    }



    this.$('.db').attr('disabled', 'disabled');
    this.$('.skipfields').attr('disabled', 'disabled');
    if(this.options.autoClose) {
      this.hide();
      this.trigger('generating', this.$('.generating').html());
    }

  },

  _fetchGET: function(options, sql) {

  },

  /**
   * Submits the form. This method is separated to ease the testing
   */
  submit: function() {
    this.$('form').submit();
  },

  /**
   * Base fetch, for the formats that don't require special threatment
   * @param  {String} formatName
   */
  fetch: function(formatName) {
    var options = this.getBaseOptions();
    options.format = formatName;
    var sql = this.getPlainSql();
    this._fetch(options, sql);
  },
  /**
   * Gets the options needed for csv format and fetch the document
   * @param  {String} formatName
   */
  fetchCSV: function() {
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
  fetchSVG: function(){
    this.$('.db').removeAttr('disabled');
    this.fetch('svg');
  },
  /**
   * Returns the html populated with current data
   * @return {String}
   */
  render_content: function() {
    return this.getTemplate('common/views/export_table_dialog')({
      formats:this.formats,
      url: this.baseUrl,
      isGeoreferenced: this.dataGeoreferenced
    });
  },

  refresh: function() {
    this.$('.content').html(this.render_content());
  }

});
