var ContentControllerView = require('new_dashboard/content_controller_view');
var Router = require('new_dashboard/router');
var LocalStorage = require('new_common/local_storage');
var UserUrl = require('new_common/urls/user_model');
var Backbone = require('backbone');
var cdbAdmin = require('cdb.admin');
var $ = require('jquery');
var _ = require('underscore');

describe('new_dashboard/content_controller_view', function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      username: 'paco'
    });
    this.router = new Router({
      currentUserUrl: new UserUrl({
        user: this.user
      })
    });

    spyOn(this.router.model, 'bind').and.callThrough();

    this.collection = new cdbAdmin.Visualizations();
    spyOn(this.collection, 'bind').and.callThrough();

    this.localStorage = new LocalStorage('test');

    this.view = new ContentControllerView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });
  });

  it('should render properly', function() {
    this.view.render();
    expect(_.size(this.view._subviews)).toBe(8);
  });

  describe('router changes', function() {

    describe('when content type is not defined', function() {

      it('should show main loader when content_type changes', function() {
        this.router.model.set({ content_type: 'datasets' });
        expect(this.view._isBlockEnabled('main_loader')).toBeTruthy();
        expect(this.view._isBlockEnabled('small_loader')).toBeFalsy();
        this.router.model.set({ tag: 'test' });
        expect(this.view._isBlockEnabled('main_loader')).toBeFalsy();
      });

    });

    describe('when content type has changed', function() {

      it('should show main loader when content_type changes', function() {
        this.router.model.set({ content_type: 'datasets' }, { silent: true });
        this.collection.reset([ new cdbAdmin.Visualization({ privacy: 'public' }) ]);
        expect(this.view._isBlockEnabled('list')).toBeTruthy();
        this.router.model.set({ content_type: 'maps' });
        expect(this.view._isBlockEnabled('main_loader')).toBeTruthy();
        expect(this.view._isBlockEnabled('small_loader')).toBeFalsy();
      });

    });

    describe('when content type hasn\'t changed', function() {

      it('should show small loader when router changes', function() {
        this.router.model.set({ content_type: 'datasets' }, { silent: true });
        this.collection.reset([ new cdbAdmin.Visualization({ privacy: 'public' }) ]);
        this.router.model.set({ tag: 'paco' });
        expect(this.view._isBlockEnabled('main_loader')).toBeFalsy();
        expect(this.view._isBlockEnabled('small_loader')).toBeTruthy();
      });

    });

  });


  describe('collection changes', function() {

    it('should show list when collection fetch works', function() {
      this.router.model.set({ content_type: 'datasets' });
      this.collection.reset([ new cdbAdmin.Visualization({ privacy: 'public' }) ]);
      expect(this.view._isBlockEnabled('list')).toBeTruthy();
      expect(this.view._isBlockEnabled('content_footer')).toBeTruthy();
      expect(this.view._isBlockEnabled('small_loader')).toBeFalsy();
      expect(this.view._isBlockEnabled('main_loader')).toBeFalsy();
      expect(_.size(this.view.enabledViews)).toBe(3);
    });

    it('should show error block when collection fetch fails', function() {
      this.router.model.set({ content_type: 'datasets' });
      this.collection.trigger('loading');
      expect(this.view._isBlockEnabled('error')).toBeFalsy();
      this.collection.trigger('error');
      expect(this.view._isBlockEnabled('error')).toBeTruthy();
      expect(this.view._isBlockEnabled('list')).toBeFalsy();
      expect(_.size(this.view.enabledViews)).toBe(2);
    });

    it('should redirect to library route when collection is empty and none of the filters are applied, being in datasets', function() {
      var url = '';
      this.router.navigate = function(u, opts) { url = u }
      this.router.model.set({ content_type: 'datasets' }, { silent: true });
      this.collection.reset([]);
      expect(url.search('library') !== -1).toBeTruthy();
    });

    it('should show onboarding map when collection is empty and content_type is in maps', function() {
      this.router.model.set({ content_type: 'maps' }, { silent: true });
      this.collection.reset([]);
      expect(this.view._isBlockEnabled('no_results')).toBeFalsy();
      expect(this.view._isBlockEnabled('onboarding')).toBeTruthy();
    });

    it('should show no_results block when collection is empty and any of the filters are enabled', function() {
      this.router.model.set({ content_type: 'datasets', tag: 'jar' }, { silent: true });
      this.collection.reset([]);
      expect(this.view._isBlockEnabled('no_results')).toBeTruthy();

      this.router.model.set({ tag: '', library: true }, { silent: true });
      this.collection.reset([]);
      expect(this.view._isBlockEnabled('no_results')).toBeTruthy();

      this.router.model.set({ library: false, q: 'paco' }, { silent: true });
      this.collection.reset([]);
      expect(this.view._isBlockEnabled('no_results')).toBeTruthy();
    });

    it('should show small_loader when collection has changed (add/remove)', function() {
      this.router.model.set({ content_type: 'datasets' }, { silent: true });
      this.collection.add(new cdbAdmin.Visualization());
      expect(this.view._isBlockEnabled('small_loader')).toBeTruthy();
      this.router.model.set({ content_type: 'maps' });
      expect(this.view._isBlockEnabled('small_loader')).toBeFalsy();
      this.collection.remove(this.collection.at(0));
      expect(this.view._isBlockEnabled('small_loader')).toBeTruthy();
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
