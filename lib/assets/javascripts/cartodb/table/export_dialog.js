
/**
 * shows a dialog to get the table exported
 * new ExportTableDialog({
 *  table: table_model
 * })
 *
 */
cdb.admin.ExportTableDialog = cdb.admin.BaseDialog.extend({

  events: cdb.core.View.extendEvents({
    'click .export:not(.disabled)': 'export'
  }),

  formats: [
    {format: 'csv', fetcher: 'fetchCSV', geomRequired: false},
    {format: 'shp', fetcher: 'fetch', geomRequired: true},
    {format: 'kml', fetcher: 'fetch', geomRequired: true},
    {format: 'svg', fetcher: 'fetchSVG', geomRequired: true},
    {format: 'geojson', fetcher: 'fetch', geomRequired: true}
  ],

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
  },

  getFormat: function(format) {
    for(var n in this.formats) {
      if(this.formats[n].format === format) {
        return this.formats[n]
      }
    }
  },

  export: function(ev) {
    this.killEvent(ev);
    var $button = $(ev.currentTarget);
    var formatName = $button.data('format');
    var format = this.getFormat(formatName);
    this[format.fetcher](formatName);
  },


  isGeoreferenced: function() {
    var currentSchema = this.model.get('schema');
    // if we have "the_geom" in our current schema, returnstrue
    for(var n in currentSchema) {
      if(currentSchema[n][0] === 'the_geom') {
        return true;
      }
    }
    return false;
  },

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

  getGeomFilteredSql: function() {
    var sql = this.getPlainSql();
    var currentSchema = this.model.get('schema');
    // if we have "the_geom" in our current schema, we apply a custom sql
    if(this.isGeoreferenced()) {
      return "SELECT *, CASE WHEN GeometryType(the_geom)='POINT' THEN ST_X(the_geom) ELSE ST_X(ST_PointOnSurface(the_geom)) END as longitude, CASE WHEN GeometryType(the_geom)='POINT' THEN ST_Y(the_geom) ELSE ST_Y(ST_PointOnSurface(the_geom)) END as latitude, ST_AsGeoJSON(the_geom,5) as geojson FROM ("+ sql + ") as subq";
    } // if not, we apply regular sql
    return sql;

  },

  _fetch: function(options, sql) {
    var self = this;
    this.$('.format').val(options.format);
    this.$('.q').val(sql);
    this.$('.filename').val(options.filename);
    this.$('.api_key').val(options.api_key);
    this.$('.generating').fadeIn();
    this.$('.geospatial').fadeOut();
    this.$('form').submit();
    this.$('.db').attr('disabled', 'disabled');
    this.$('.skipfields').attr('disabled', 'disabled');
  },
  fetch: function(formatName) {
    var options = this.getBaseOptions();
    options.format = formatName;
    var sql = this.getPlainSql();
    this._fetch(options, sql);
  },
  fetchCSV: function(formatName) {
    var options = this.getBaseOptions();
    options.format = formatName;
    var sql = this.getGeomFilteredSql();
    this.$('.skipfields').removeAttr('disabled');
    this._fetch(options, sql);
  },
  fetchSVG: function(){
    this.$('.db').removeAttr('disabled');
    this.fetch();
  },
  render_content: function() {
    console.log(this.isGeoreferenced());
    return this.getTemplate('common/views/export_table_dialog')({
      formats:this.formats,
      url: this.baseUrl,
      hasGeom: this.isGeoreferenced()
    });
  }
});
