var Backbone = require('backbone');
var cdb = require('cartodb.js');
var Router = require('../../../../../javascripts/cartodb/new_dashboard/router');
var ImportsModel = require('../../../../../javascripts/cartodb/new_common/imports_model');
var BackgroundImporterView = require('../../../../../javascripts/cartodb/new_dashboard/background_importer/background_importer_view');

describe('new_dashboard/background_importer/background_importer_view', function() {

  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
    });

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });

    this.router.model.set({
      content_type: 'datasets'
    });

    spyOn(cdb.god, 'bind').and.callThrough();
    spyOn(this.router.model, 'bind').and.callThrough();

    this.view = new BackgroundImporterView({
      router: this.router,
      items: new Backbone.Collection(),
      user: this.user
    });

    this.createImportsModel = function(state) {
      return new ImportsModel({
        state: state
      }, {
        user: this.user
      });
    }.bind(this);

    this.view.collection.pollCheck = function() {};
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$('.BackgroundImporter-header').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-body').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-list').length).toBe(1);
  });

  it('should listen for cdb.god events', function() {
    var args = cdb.god.bind.calls.argsFor(0);
    expect(args[0]).toEqual('datasetSelected remoteSelected');
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
    this.view.collection.add(mdl);
    expect(this.view.show).toHaveBeenCalled();
    expect(this.view.hide).not.toHaveBeenCalled();
    this.view.collection.remove(mdl);
    expect(this.view.show.calls.count()).toEqual(1);
    expect(this.view.hide).toHaveBeenCalled();
  });

  it('should check if any import has failed when any has changed', function() {
    this.view.render();
    var mdl = new ImportsModel();
    this.view.collection.add(mdl);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').length).toBe(0);
    mdl.set('state', 'error');
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').text()).toBe('1');
    var mdl2 = new ImportsModel();
    this.view.collection.add(mdl2);
    mdl2.set('state', 'error');
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').text()).toBe('2');
    var mdl3 = new ImportsModel();
    this.view.collection.add(mdl3);
    mdl3.set('state', 'completed');
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').text()).toBe('2');
    this.view.collection.remove(mdl);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').text()).toBe('1');
    this.view.collection.remove(mdl2);
    expect(this.view.$('.BackgroundImporter-headerBadgeCount').length).toBe(0);
  });

  it('should check if application should redirect user to map/dataset view', function() {
    this.view.render();
    this.view.items.fetch = function() {};
    this.view.user.fetch = function() {};

    spyOn(this.view, '_redirect');

    var mdl = this.createImportsModel('error');
    this.view.collection.add(mdl);
    expect(this.view._redirect).not.toHaveBeenCalled();
    var mdl1 = this.createImportsModel('pending');
    this.view.collection.add(mdl1);
    expect(this.view._redirect).not.toHaveBeenCalled();
    var mdl2 = this.createImportsModel('pending');
    this.view.collection.add(mdl2);
    expect(this.view._redirect).not.toHaveBeenCalled();
    mdl1.set('state', 'complete');
    expect(this.view._redirect).not.toHaveBeenCalled();
    this.view.collection.remove(mdl1);
    mdl2.imp.set({ table_name: 'jur', tables_created_count: 1 });
    mdl2.set({ state: 'complete' });
    expect(this.view._redirect).toHaveBeenCalledWith('http://paco.cartodb.com/tables/jur');
  });

  describe('import limits', function() {

    beforeEach(function() {
      this.user.set('actions', { import_quota: 2 });
    });

    it("should check if user can import before add the item", function() {
      spyOn(this.view.collection, 'canImport');
      this.view._addDataset({ hello: 'hello' });
      expect(this.view.collection.canImport).toHaveBeenCalled();
      expect(this.view.collection.canImport.calls.count()).toBe(1);
      this.view._onDroppedFile([{ hello: 'hello' }]);
      expect(this.view.collection.canImport.calls.count()).toBe(2);
    });

    it("should add limits view when user has reached his/her import quota", function() {
      _.times(2, function(){
        this.view.collection.add(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view.model.get('importLimit')).not.toBe(undefined);
    });

    it("should remove limits view when user has available slots", function() {
      _.times(2, function(){
        this.view.collection.add(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view.model.get('importLimit')).not.toBe(undefined);

      this.view.collection.each(function(m, i) {
        if (i < 2) {
          m.set({
            step: 'upload',
            state: 'error'
          });
        }
      });

      this.view._addDataset({ hello: 'hello' });
      expect(this.view.model.get('importLimit')).toBe(undefined);
    });

    it('should not redirect to item url when it is imported if limits view is included', function() {
      spyOn(this.view, '_goTo');
      this.user.set('actions', { import_quota: 1 });

      _.times(1, function(){
        this.view.collection.add(
          this.createImportsModel('pending')
        );
      }, this);

      this.view._addDataset({ hello: 'hello' });
      expect(this.view.model.get('importLimit')).not.toBe(undefined);
      var m = this.view.collection.at(0);
      spyOn(m, 'hasCompleted').and.returnValue(true);
      m.set({
        state: 'success',
        step: 'import'
      });

      expect(this.view._goTo).not.toHaveBeenCalled();
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
