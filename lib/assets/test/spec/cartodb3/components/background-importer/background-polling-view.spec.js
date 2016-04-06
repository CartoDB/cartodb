var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var ImportsModel = require('../../../../../javascripts/cartodb3/data/background-importer/imports-model.js');
var BackgroundPollingView = require('../../../../../javascripts/cartodb3/components/background-importer/background-polling-view.js');
var BackgroundPollingModel = require('../../../../../javascripts/cartodb3/data/background-importer/background-polling-model.js');
var ImportsCollection = require('../../../../../javascripts/cartodb3/data/background-importer/background-importer-imports-collection.js');
var GeocodingsCollection = require('../../../../../javascripts/cartodb3/data/background-importer/background-importer-geocodings-collection.js');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');

describe('common/background-polling/background-polling-view', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    cdb.god = new cdb.core.Model();
    spyOn(cdb.god, 'bind').and.callThrough();

    this.importsCollection = new ImportsCollection(undefined, {
      userModel: this.userModel,
      configModel: this.configModel
    });

    this.geocodingsCollection = new GeocodingsCollection(undefined, {
      configModel: this.configModel,
      vis: {}
    });

    this.model = new BackgroundPollingModel({}, {
      vis: {},
      userModel: this.userModel,
      configModel: this.configModel,
      importsCollection: this.importsCollection,
      geocodingsCollection: this.geocodingsCollection
    });

    this.view = new BackgroundPollingView({
      model: this.model,
      createVis: {},
      userModel: this.userModel,
      configModel: this.configModel
    });

    this.createImportsModel = function (state) {
      return new ImportsModel({
        state: state
      }, {
        userModel: this.userModel,
        configModel: {}
      });
    }.bind(this);
  });

  it('should render properly', function () {
    this.view.render();
    expect(this.view.$('.BackgroundPolling-header').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-body').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-list').length).toBe(1);
  });

  xit('should listen for cdb.god events', function () {
    var args = cdb.god.bind.calls.argsFor(0);
    expect(args[0]).toEqual('importByUploadData');
    expect(args[1]).toEqual(this.view._addDataset);
    expect(args[2]).toEqual(this.view);

    var args1 = cdb.god.bind.calls.argsFor(1);
    expect(args1[0]).toEqual('fileDropped');
    expect(args1[1]).toEqual(this.view._onDroppedFile);
    expect(args1[2]).toEqual(this.view);
  });

  it('should toggle visibility depending the size of the collection', function () {
    var mdl = new ImportsModel({}, {
      userModel: this.userModel,
      configModel: {}
    });
    spyOn(this.view, 'hide');
    spyOn(this.view, 'show');
    this.model.addImportItem(mdl);
    expect(this.view.show).toHaveBeenCalled();
    expect(this.view.hide).not.toHaveBeenCalled();
    this.model.removeImportItem(mdl);
    expect(this.view.show.calls.count()).toEqual(1);
    expect(this.view.hide).toHaveBeenCalled();
  });

  it('should check if any import has failed when any has changed', function () {
    this.view.render();
    var mdl = new ImportsModel({}, {
      userModel: this.userModel,
      configModel: {}
    });
    this.model.addImportItem(mdl);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(0);
    mdl.set('state', 'error');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('1');
    var mdl2 = new ImportsModel({}, {
      userModel: this.userModel,
      configModel: {}
    });
    this.model.addImportItem(mdl2);
    mdl2.set('state', 'error');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('2');
    var mdl3 = new ImportsModel({}, {
      userModel: this.userModel,
      configModel: {}
    });
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

  describe('import limits', function () {
    beforeEach(function () {
      this.userModel.set('limits', { concurrent_imports: 2 });
    });

    it('should check if user can import before add the item', function () {
      spyOn(this.model, 'canAddImport');
      this.view._addDataset({ hello: 'hello' });
      expect(this.model.canAddImport).toHaveBeenCalled();
      expect(this.model.canAddImport.calls.count()).toBe(1);
      this.view._onDroppedFile([{ hello: 'hello' }]);
      expect(this.model.canAddImport.calls.count()).toBe(2);
    });

    it('should add limits view when user has reached his/her import quota', function () {
      _.times(2, function () {
        this.model.addImportItem(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view._importLimit).not.toBe(undefined);
    });

    it('should remove limits view when user has available slots', function () {
      _.times(2, function () {
        this.model.addImportItem(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view._importLimit).not.toBe(undefined);

      this.model.importsCollection.each(function (m, i) {
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

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
