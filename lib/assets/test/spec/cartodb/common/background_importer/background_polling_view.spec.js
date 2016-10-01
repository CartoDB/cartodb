var Backbone = require('backbone-cdb-v3');
var cdb = require('cartodb.js-v3');
var ImportsModel = require('../../../../../javascripts/cartodb/common/background_polling/models/imports_model');
var BackgroundPollingView = require('../../../../../javascripts/cartodb/common/background_polling/background_polling_view');
var DashboardBackgroundPollingModel = require('../../../../../javascripts/cartodb/dashboard/background_polling_model');
var ImportsCollection = require('../../../../../javascripts/cartodb/common/background_polling/models/imports_collection');
var GeocodingsCollection = require('../../../../../javascripts/cartodb/common/background_polling/models/geocodings_collection');

describe('common/background_polling/background_polling_view', function() {

  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });

    spyOn(cdb.god, 'bind').and.callThrough();

    this.importsCollection = new ImportsCollection(undefined, {
      user: this.user
    });
    this.geocodingsCollection = new GeocodingsCollection(undefined, {
      user: this.user
    });
    this.model = new DashboardBackgroundPollingModel({}, {
      user: this.user,
      importsCollection: this.importsCollection,
      geocodingsCollection: this.geocodingsCollection
    });
    this.view = new BackgroundPollingView({
      model: this.model,
      createVis: false,
      user: this.user
    });

    this.createImportsModel = function(state) {
      return new ImportsModel({
        state: state
      }, {
        user: this.user
      });
    }.bind(this);
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$('.BackgroundPolling-header').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-body').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-list').length).toBe(1);
  });

  it('should listen for cdb.god events', function() {
    var args = cdb.god.bind.calls.argsFor(0);
    expect(args[0]).toEqual('importByUploadData');
    expect(args[1]).toEqual(this.view._addDataset);
    expect(args[2]).toEqual(this.view);

    var args1 = cdb.god.bind.calls.argsFor(1);
    expect(args1[0]).toEqual('fileDropped');
    expect(args1[1]).toEqual(this.view._onDroppedFile);
    expect(args1[2]).toEqual(this.view);
  });

  it('should toggle visibility depending the size of the collection', function() {
    var mdl = new ImportsModel();
    spyOn(this.view, 'hide');
    spyOn(this.view, 'show');
    this.model.addImportItem(mdl);
    expect(this.view.show).toHaveBeenCalled();
    expect(this.view.hide).not.toHaveBeenCalled();
    this.model.removeImportItem(mdl);
    expect(this.view.show.calls.count()).toEqual(1);
    expect(this.view.hide).toHaveBeenCalled();
  });

  it('should check if any import has failed when any has changed', function() {
    this.view.render();
    var mdl = new ImportsModel();
    this.model.addImportItem(mdl);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(0);
    mdl.set('state', 'error');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('1');
    var mdl2 = new ImportsModel();
    this.model.addImportItem(mdl2);
    mdl2.set('state', 'error');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('2');
    var mdl3 = new ImportsModel();
    this.model.addImportItem(mdl3);
    mdl3.set('state', 'completed');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('2');
    this.model.removeImportItem(mdl);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('1');
    this.model.removeImportItem(mdl2);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(0);
  });

  describe('import limits', function() {
    beforeEach(function() {
      this.user.set('limits', { concurrent_imports: 2 });
    });

    it("should check if user can import before add the item", function() {
      spyOn(this.model, 'canAddImport');
      this.view._addDataset({ hello: 'hello' });
      expect(this.model.canAddImport).toHaveBeenCalled();
      expect(this.model.canAddImport.calls.count()).toBe(1);
      this.view._onDroppedFile([{ hello: 'hello' }]);
      expect(this.model.canAddImport.calls.count()).toBe(2);
    });

    it("should add limits view when user has reached his/her import quota", function() {
      _.times(2, function(){
        this.model.addImportItem(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view._importLimit).not.toBe(undefined);
    });

    it("should remove limits view when user has available slots", function() {
      _.times(2, function(){
        this.model.addImportItem(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view._importLimit).not.toBe(undefined);

      this.model.importsCollection.each(function(m, i) {
        if (i < 2) {
          m.set({
            step: 'upload',
            state: 'error'
          });
        }
      });

      this.view._addDataset({ hello: 'hello' });
      expect(this.view._importLimit).toBe(undefined);
    });
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});
