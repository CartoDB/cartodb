var Backbone = require('backbone');
var cdb = require('cartodb.js');
var Router = require('../../../../../javascripts/cartodb/new_dashboard/router');
var UserUrl = require('../../../../../javascripts/cartodb/new_common/urls/user_model');
var ImportsModel = require('../../../../../javascripts/cartodb/new_dashboard/background_importer/imports_model');
var BackgroundImporterView = require('../../../../../javascripts/cartodb/new_dashboard/background_importer/background_importer_view');
var BackgroundImporterItemView = require('../../../../../javascripts/cartodb/new_dashboard/background_importer/background_importer_item_view');

describe('new_dashboard/background_importer/background_importer_item_view', function() {

  beforeEach(function() {
    var user = new cdb.admin.User({ username: 'paco' });

    this.router = new Router({
      currentUserUrl: new UserUrl({
        account_host: 'cartodb.com',
        user: user
      })
    });

    this.router.model.set({
      content_type: 'datasets'
    });

    this.model = new ImportsModel();

    spyOn(this.router.model, 'bind').and.callThrough();
    spyOn(this.model, 'bind').and.callThrough();

    this.view = new BackgroundImporterItemView({
      router: this.router,
      model: this.model,
      user: user
    });
  });

  it('should render properly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('ImportItem')).toBeTruthy();
    expect(this.view.$('.ImportItem-text').length).toBe(1);
  });

  it('should bind model changes', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:state');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('change');
    expect(this.model.bind.calls.argsFor(2)[0]).toEqual('remove');
  });

  it('should stop upload and remove it when upload is aborted', function() {
    this.view.render();
    spyOn(this.view, 'clean');
    this.model.set('state', 'uploading');
    this.view.$('.js-abort').click();
    expect(this.view.clean).toHaveBeenCalled();
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});
