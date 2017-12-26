var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var RowModel = require('./row_model');
var RowsView = require('./rows_view');
var DefaultFooterView = require('./default_footer_view');
var ViewFactory = require('../../view_factory');

/**
 * Model for the Lon/Lat georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'Lon/Lat Columns',

  defaults: {
    columnsNames: []
  },

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
    if (!attrs.columnsNames) throw new Error('columnsNames is required');
  },

  createView: function() {
    this.set({
      canContinue: false,
      hideFooter: false
    });
    this._initRows();

    return ViewFactory.createByList([
      ViewFactory.createByTemplate('common/dialogs/georeference/default_content_header', {
        title: 'Select the columns containing your Lon/Lat columns',
        desc: 'The selected columns are transformed into georeference coordinates.'
      }),
      new RowsView({
        model: this
      }),
      new DefaultFooterView({
        model: this
      })
    ]);
  },

  assertIfCanContinue: function() {
    var canContinue = this.get('rows').all(function(m) {
      return !!m.get('value');
    });
    this.set('canContinue', canContinue);
  },

  continue: function() {
    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'lonlat',
      longitude: this.get('rows').first().get('value'),
      latitude: this.get('rows').last().get('value')
    });

    this.set('geocodeData', d);
  },

  _initRows: function() {
    var rows = new Backbone.Collection([
      new RowModel({
        comboViewClass: 'Combo',
        label: 'Select your Longitude',
        placeholder: 'Select column',
        property: 'longitude',
        data: this.get('columnsNames')
      }),
      new RowModel({
        comboViewClass: 'Combo',
        label: 'Select your Latitude',
        placeholder: 'Select column',
        property: 'latitude',
        data: this.get('columnsNames')
      })
    ]);
    this.set('rows', rows);
  }
});
