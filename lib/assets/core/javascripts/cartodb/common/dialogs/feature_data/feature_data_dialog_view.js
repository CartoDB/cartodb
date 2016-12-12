var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var FormView = require('./form_view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var _ = require('underscore-cdb-v3');


/**
 *  Feature data edition dialog
 */
module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-back': '_showForm'
  }),

  className: 'Dialog is-opening FeatureData',

  initialize: function() {
    this.elder('initialize');

    if (!this.options.table) {
      throw new TypeError('table is required');
    }

    this.row = this.options.row;
    this.table = this.options.table;
    this.baseLayer = this.options.baseLayer;
    this.dataLayer = this.options.dataLayer;
    this.provider = this.options.provider;
    this.currentZoom = this.options.currentZoom;
    this.user = this.options.user;
    this._template = cdb.templates.getTemplate('common/dialogs/feature_data/feature_data_dialog');
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

  _initViews: function() {
    var self = this;

    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-content')
    });

    // Create map
    setTimeout(function() {
      self._createPreviewMap()
    }, 200);

    // Create form
    this.form = new FormView({
      el: this.$('.js-form'),
      table: this.table,
      row: this.row
    });

    this.form.bind('onSubmit', this._changeAttributes, this);
    this.form.bind('onError', this._scrollToError, this);
    this._panes.addTab('form', this.form.render());

    this.addView(this.form);

    // Create loading
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Saving new data...',
        quote: randomQuote()
      }).render()
    );

    // Create error
    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Sorry, something went wrong but you can get <button class="Button--link js-back">back to the form</button>.'
      }).render()
    );

    this._panes.active('form');
  },

  _scrollToError: function(mdl) {
    this.$('.js-content').animate({
      scrollTop: ( this.$(".EditField-label[value='" + mdl.get('attribute') + "']").position().top - 20 )
    });
  },

  _changeAttributes: function(attrs) {
    var self = this;
    var newData = _.object(_.pluck(attrs, 'attribute'), _.pluck(attrs, 'value'));
    var oldData = {};

    // Change state
    this._panes.active('loading');

    // Unset columns already not present in the
    // new form data
    _.each(this.row.attributes, function(val, key) {
      if (newData[key] === undefined && !cdb.admin.Row.isReservedColumn(key) && key !== "id") {
        self.row.unset(key) 
      }
      oldData[key] = val;
    });

    if (!_.isEmpty(this.row.changedAttributes(newData))) {
      // Save new attributes
      this.row.save(newData, {
        success: function() {
          self._ok();
        },
        error: function() {
          self.row.set(oldData);
          self._panes.active('error');
        }
      });
    } else {
      self._cancel();
    }
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
        } else {
          // Rest of geometries
          self.map.setBounds(r);
        }
        self.map.setZoom(self.currentZoom);
      }
    });
  },

  _showForm: function() {
    this._panes.active('form');
  },

  _ok: function() {
    this.options.onDone && this.options.onDone();
    this.elder('_ok');
  },

  _cancel: function() {
    this.elder('_cancel');
  }

});
