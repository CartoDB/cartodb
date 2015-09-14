var Backbone = require('backbone');
var cdb = require('cartodb.js');
var ImportsModel = require('../../../../../javascripts/cartodb/common/background_polling/models/imports_model');
var BackgroundPollingView = require('../../../../../javascripts/cartodb/editor/background_polling_view');
var EditorBackgroundPollingModel = require('../../../../../javascripts/cartodb/editor/background_polling_model');
var ImportsCollection = require('../../../../../javascripts/cartodb/common/background_polling/models/imports_collection');
var GeocodingsCollection = require('../../../../../javascripts/cartodb/common/background_polling/models/geocodings_collection');

describe('common/background_polling/background_polling_editor_view', function() {

  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco',
      limits: {
        concurrent_imports: 2,
        max_layers: 3
      }
    });

    spyOn(cdb.god, 'bind').and.callThrough();

    this.importsCollection = new ImportsCollection(undefined, {
      user: this.user
    });
    this.geocodingsCollection = new GeocodingsCollection(undefined, {
      user: this.user
    });
    this.model = new EditorBackgroundPollingModel({}, {
      user: this.user,
      importsCollection: this.importsCollection,
      geocodingsCollection: this.geocodingsCollection
    });

    this.vis = new cdb.admin.Visualization({
      map_id: 6,
      type: "derived"
    });

    this.view = new BackgroundPollingView({
      model: this.model,
      vis: this.vis,
      createVis: false,
      user: this.user
    });
  });

  it("shouldn't let user add more layers than allowed", function() {
    spyOn(this.vis.map.layers, 'getDataLayers').and.returnValue([1,2,3]);
    this.view._addImportsItem({ type: 'file', value: { name: 'fake.csv', size: 1 } });
    var imp = this.importsCollection.at(0);
    var error = imp.getError();
    expect(error.error_code).toBe(8005);
  });

  afterEach(function() {
    this.view.clean();
  });

});
