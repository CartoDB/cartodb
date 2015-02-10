var Backbone = require('backbone');
var cdb = require('cartodb.js');
var Router = require('new_dashboard/router');
var UserUrl = require('new_common/urls/user_model');
var ImportsModel = require('new_dashboard/background_importer/imports_model');
var BackgroundImporterView = require('new_dashboard/background_importer/background_importer_view');

describe('new_dashboard/background_importer/background_importer_view', function() {
  
  beforeEach(function() {
    var user = new cdb.admin.User({ username: 'paco' });

    this.router = new Router({
      currentUserUrl: new UserUrl({
        user: user
      })
    });

    this.router.model.set({
      content_type: 'datasets'
    });

    spyOn(this.router.model, 'bind').and.callThrough();
    
    this.view = new BackgroundImporterView({
      router: this.router,
      items: new Backbone.Collection(),
      user: user
    });

    this.view.collection.pollCheck = function() {};
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$('.BackgroundImporter-header').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-body').length).toBe(1);
    expect(this.view.$('.BackgroundImporter-list').length).toBe(1);
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

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

  
});
