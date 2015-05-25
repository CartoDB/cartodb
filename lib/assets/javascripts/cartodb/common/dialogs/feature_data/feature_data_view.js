var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var FormView = require('./form_view');


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

    this.table = this.options.table;
    this.baseLayer = this.options.baseLayer;
    this.dataLayer = this.options.dataLayer;
    this.provider = this.options.provider;
    this.user = this.options.user;
    this._template = cdb.templates.getTemplate('common/dialogs/feature_data/template');
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
      featureType: this.model.getFeatureType()
    });
  },

  _initViews: function() {
    var self = this;

    // Create map
    setTimeout(function() {
      self._createFakeMap()
    }, 200);

    // Create form
    var form = new FormView({
      el: this.$('.js-form'),
      table: this.table,
      row: this.model
    });

    form.bind('saved', this._ok, this);
    this.addView(form);
    form.render();
  },

  _createFakeMap: function() {
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
    this.dataLayer.set('query', 'SELECT * FROM ' + this.table.get('name') + ' WHERE cartodb_id=' + this.model.get('cartodb_id'));
    this.map.addLayer(this.dataLayer);
    this.dataLayer.set('attribution', '');

    // Layer with sql applied
    // debugger;
    // Apply SQL
    // Remove unnecessary layers
    // debugger;

    // Set bounds
    // var sql = new cartodb.SQL({ user: this.user.get('username') });
    // sql.getBounds('SELECT * FROM ' + this.table.get('name') + ' WHERE cartodb_id=' + this.model.get('cartodb_id')).done(function(bounds) {
    //   if (bounds) {
    //     self.map.setBounds(bounds);  
    //   }
    // });
  },

  _cleanMap: function() {
    this.mapView.clean()
  },

  clean: function() {
    this.map._cleanMap();
    this.elder('clean');
  }

});
