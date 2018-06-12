const _ = require('underscore');
const ImportsModel = require('dashboard/data/imports-model');
const BackgroundPollingView = require('dashboard/views/dashboard/background-polling/background-polling-view');
const DashboardBackgroundPollingModel = require('dashboard/data/background-polling/background-polling-model');
const ImportsCollection = require('dashboard/data/imports-collection');
const GeocodingsCollection = require('dashboard/data/background-polling/geocodings-collection');
const Notifier = require('builder/components/notifier/notifier');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/dashboard/background-polling/background-polling-view', function () {
  let addImportSpy;

  beforeEach(function () {
    addImportSpy = spyOn(BackgroundPollingView.prototype, '_addImport');

    this.user = new UserModel({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });

    this.importsCollection = new ImportsCollection(undefined, {
      userModel: this.user,
      configModel: ConfigModelFixture
    });
    this.geocodingsCollection = new GeocodingsCollection(undefined, {
      userModel: this.user,
      configModel: ConfigModelFixture
    });
    this.model = new DashboardBackgroundPollingModel({}, {
      configModel: ConfigModelFixture,
      userModel: this.user,
      importsCollection: this.importsCollection,
      geocodingsCollection: this.geocodingsCollection
    });
    this.view = new BackgroundPollingView({
      configModel: ConfigModelFixture,
      userModel: this.user,
      model: this.model,
      createVis: false,
      user: this.user
    });

    this.createImportsModel = function (state) {
      return new ImportsModel({
        state: state
      }, {
        userModel: this.user,
        configModel: ConfigModelFixture
      });
    }.bind(this);
  });

  it('should render properly', function () {
    this.view.render();
    expect(this.view.$('.BackgroundPolling-header').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-body').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-list').length).toBe(1);
  });

  it('should listen for cdb.god events', function () {
    this.model.trigger('importAdded');
    expect(addImportSpy).toHaveBeenCalled();
  });

  it('should toggle visibility depending the size of the collection', function () {
    var mdl = new ImportsModel(null, {
      userModel: this.user,
      configModel: ConfigModelFixture
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
    var mdl = new ImportsModel(null, {
      userModel: this.user,
      configModel: ConfigModelFixture
    });
    this.model.addImportItem(mdl);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(0);
    mdl.set('state', 'error');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('1');
    var mdl2 = new ImportsModel(null, {
      userModel: this.user,
      configModel: ConfigModelFixture
    });
    this.model.addImportItem(mdl2);
    mdl2.set('state', 'error');
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundPolling-headerBadgeCount').text()).toBe('2');
    var mdl3 = new ImportsModel(null, {
      userModel: this.user,
      configModel: ConfigModelFixture
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
      this.user.set('limits', { concurrent_imports: 2 });
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
    Notifier.getCollection().reset();
    this.view.clean();
  });
});
