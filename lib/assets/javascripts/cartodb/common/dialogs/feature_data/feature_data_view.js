var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var FormView = require('./form_view');
var randomQuote = require('../../view_helpers/random_quote');


/**
 *  Feature data edition dialog
 */
module.exports = BaseDialog.extend({

  className: 'Dialog is-opening FeatureData',

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new TypeError('table is required');
    }

    this.model = new cdb.core.Model({
      state: 'idle'
    });

    this.row = this.options.row;
    this.table = this.options.table;
    this.baseLayer = this.options.baseLayer;
    this.dataLayer = this.options.dataLayer;
    this.provider = this.options.provider;
    this.currentZoom = this.options.currentZoom;
    this.user = this.options.user;
    this._template = cdb.templates.getTemplate('common/dialogs/feature_data/template');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this._template({
      featureType: this.row.getFeatureType(),
      quote: randomQuote()
    });
  },

  _initBinds: function() {
    this.model.bind('change:state', this._show, this);
  },

  _initViews: function() {
    var self = this;

    // Create map
    setTimeout(function() {
      self._createPreviewMap()
    }, 200);

    // Create form
    var form = new FormView({
      el: this.$('.js-form'),
      table: this.table,
      row: this.row
    });

    form.bind('saved', this._ok, this);
    this.addView(form);
    form.render();
  },

  _createPreviewMap: function() {
    var self = this;

    // Create map
    var div = this.$('.js-map');

    var mapViewClass = cdb.admin.LeafletMapView;
    if (this.provider === 'googlemaps') {
      var mapViewClass = cdb.admin.GoogleMapsMapView;
    }

    // New map
    this.map = new cdb.admin.Map();

    this.mapView = new mapViewClass({
      el: div,
      map: this.map,
      user: this.user
    });

    // Base layer
    this.baseLayer.set('attribution', '');
    this.map.addLayer(this.baseLayer);

    // Data layer
    this.dataLayer.set('query', 'SELECT * FROM ' + this.table.get('name') + ' WHERE cartodb_id=' + this.row.get('cartodb_id'));
    this.dataLayer.set('attribution', '');
    this.map.addLayer(this.dataLayer);
    

    // Set bounds
    var sql = new cdb.admin.SQL({
      user: this.user.get('username'),
      api_key: this.user.get('api_key')
    });
    sql.getBounds('SELECT * FROM ' + this.table.get('name') + ' WHERE cartodb_id=' + this.row.get('cartodb_id')).done(function(r) {
      if (r) {
        if (r[0][0] === r[1][0] && r[0][1] === r[1][1]) {
          // Point geometry
          self.map.setCenter(r[0]);
          self.map.setZoom(self.currentZoom);
        } else {
          // Rest of geometries
          self.map.setBounds(r);  
        }
      }
    });
  },

  _cleanMap: function() {
    this.mapView.clean()
  },

  clean: function() {
    this.map._cleanMap();
    this.elder('clean');
  }

});
