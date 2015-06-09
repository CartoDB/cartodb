var cdb = require('cartodb.js');
var FeatureDataDialogView = require('../../../../../javascripts/cartodb/common/dialogs/feature_data/feature_data_dialog_view');

describe('common/dialogs/feature_data_dialog', function() {

  beforeEach(function() {

    this.rowModel = new cdb.admin.Row({
      cartodb_id: 1,
      test: 'test',
      test1: 1,
      test2: null,
      the_geom: '{ "type": "Point", "coordinates": [100.0, 0.0] }'
    }),
    this.rowModel = new cdb.admin.Row({
      
    });
    
    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'testTable',
      name: 'testTable',
      schema: [ ['cartodb_id', 'number'], ['test', 'string'], ['test1', 'number'], ['test2', 'boolean'], ['the_geom', 'geometry']],
      geometry_types: ['ST_MultiPoint'] 
    });

    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
    });

    this.view = new FeatureDataDialogView({
      row: this.rowModel,
      provider: "leaflet",
      baseLayer: new cdb.geo.TileLayer({ id: 'baselayer_0' }),
      dataLayer: new cdb.admin.CartoDBLayer({ id: 'layer_0' }),
      currentZoom: 8,
      enter_to_confirm: false,
      table: this.table,
      user: this.user,
      clean_on_hide: true,
      done: function() {
        console.log('on done?');
      }
    });
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('.js-map').length).toBe(1);
    expect(this.view.$('.js-form').length).toBe(1);
    expect(this.view.$('.js-addField').length).toBe(1); // Add column
    expect(this.view.$('.IntermediateInfo').length).toBe(2); // Loading and error divs
    expect(this.view.$('.Spinner').length).toBe(1); // Loading
    expect(this.view.$('.LayoutIcon.LayoutIcon--negative').length).toBe(1); // Error
  });

  it("should create panes and needed form", function() {
    expect(this.view._panes).not.toBeUndefined();
    expect(_.size(this.view._panes._subviews)).toBe(3);
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});