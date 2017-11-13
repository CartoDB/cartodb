var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ContentControllerView = require('../../../../javascripts/cartodb/dashboard/content_controller_view_static');
var Router = require('../../../../javascripts/cartodb/dashboard/router');
var LocalStorage = require('../../../../javascripts/cartodb/common/local_storage');

describe('dashboard/content_controller_view_static', function () {
  beforeEach(function () {
    this.collection = new cdb.admin.Visualizations();
    spyOn(this.collection, 'bind').and.callThrough();

    var attrs = {
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    };

    this.user = new cdb.admin.User(attrs);
    spyOn(this.user, 'featureEnabled').and.returnValue(true);

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });
    spyOn(this.router.model, 'bind').and.callThrough();

    this.localStorage = new LocalStorage('test');

    this.view = new ContentControllerView({
      headerHeight: 80,
      user: this.user,
      router: this.router,
      collection: this.collection,
      localStorage: this.localStorage
    });

    this.vis = new cdb.admin.Visualization({
      privacy: 'public',
      permission: {
        owner: attrs
      }
    });

    window.defaultFallbackMapBaselayer = {
      url: ''
    };
  });

  describe('.render', function () {
    it('should render properly', function () {
      spyOn(this.view, '_initViews');

      this.view.render();

      expect(this.view.$el.html()).toContain('<div class="Filters"></div>');
      expect(this.view.$el.html()).toContain('<div class="NoDatasets"></div>');
      expect(this.view.$el.html()).toContain('<div class="ContentList" id="content-list"></div>');
      expect(this.view.$el.html()).toContain('<div class="ContentFooter" id="content-footer"></div>');
      expect(this.view._initViews).toHaveBeenCalled();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(9);
    });
  });

  describe('router changes', function () {
    beforeEach(function () {
      this.view.render();
    });

    describe('when content type is not defined', function () {
      it('should show main loader when content_type changes', function () {
        this.collection.total_user_entries = 10;
        this.router.model.set({ content_type: 'datasets' });

        expect(this.view._isBlockEnabled('main_loader')).toBe(true);

        this.collection.reset([ this.vis ]);
        this.router.model.set({ tag: 'test' });

        expect(this.view._isBlockEnabled('main_loader')).toBe(false);
      });
    });

    describe('when content type has changed', function () {
      it('should show main loader when content_type changes', function () {
        this.router.model.set({ content_type: 'datasets' }, { silent: true });
        this.collection.reset([ this.vis ]);

        expect(this.view._isBlockEnabled('list')).toBe(true);

        this.router.model.set({ content_type: 'maps' });

        expect(this.view._isBlockEnabled('main_loader')).toBe(true);
      });
    });

    describe('when content type hasn\'t changed', function () {
      it('should show small loader when router changes', function () {
        this.collection.total_user_entries = 3;
        this.router.model.set({ content_type: 'datasets' }, { silent: true });
        this.collection.reset([ this.vis ]);
        this.router.model.set({ tag: 'paco' });

        expect(this.view._isBlockEnabled('main_loader')).toBe(false);
      });

      it('should show main loader when content type doesn\'t change but user didn\'t have entries', function () {
        this.router.model.set({ content_type: 'datasets' }, { silent: true });
        this.collection.total_user_entries = 0;
        this.collection.reset([ this.vis ]);
        this.router.model.set({ shared: 'only' });

        expect(this.view._isBlockEnabled('main_loader')).toBe(true);
      });
    });
  });

  describe('collection changes', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should show list when collection fetch works', function () {
      this.router.model.set({ content_type: 'datasets' });
      this.collection.reset([ this.vis ]);

      expect(this.view._isBlockEnabled('list')).toBe(true);
      expect(this.view._isBlockEnabled('content_footer')).toBe(true);
      expect(this.view._isBlockEnabled('main_loader')).toBe(false);
      expect(_.size(this.view.enabledViews)).toBe(3);
    });

    it('should show error block when collection fetch fails', function () {
      this.router.model.set({ content_type: 'datasets' });
      this.collection.trigger('loading');

      expect(this.view._isBlockEnabled('error')).toBe(false);

      this.collection.trigger('error');

      expect(this.view._isBlockEnabled('error')).toBe(true);
      expect(this.view._isBlockEnabled('list')).toBe(false);
      expect(_.size(this.view.enabledViews)).toBe(2);
    });

    it('shouldn\'t show error block when collection fetch is aborted', function () {
      this.router.model.set({ content_type: 'datasets' });
      this.collection.trigger('loading');

      expect(this.view._isBlockEnabled('error')).toBe(false);

      this.collection.trigger('error', this.collection, { statusText: 'abort' }, {});

      expect(this.view._isBlockEnabled('error')).toBe(false);
      expect(_.size(this.view.enabledViews)).toBe(2);
    });

    it('should not redirect to shared route when collection is empty, none of the filters are applied but shared datasets are present, being in datasets', function () {
      var url = '';
      var options;
      this.router.navigate = function (u, opts) {
        url = u;
        options = opts;
      };
      this.router.model.set({ content_type: 'datasets' }, { silent: true });
      this.collection.total_shared = 10;
      this.collection.reset([]);

      expect(url.toString().search('shared') === -1).toBe(true);
    });

    it('should not redirect to library route when collection is empty and none of the filters are applied, being in datasets', function () {
      cdb.config.set('data_library_enabled', true);
      var url = '';
      var options;
      this.router.navigate = function (u, opts) {
        url = u;
        options = opts;
      };
      this.router.model.set({ content_type: 'datasets' }, { silent: true });
      this.collection.total_shared = 0;
      this.collection.reset([]);

      expect(url.toString().search('library') === -1).toBe(true);
    });

    it('should show empty datasets when collection is empty, none of the filters are applied and data library is disabled', function () {
      cdb.config.set('data_library_enabled', false);
      this.router.model.set({ content_type: 'datasets', library: true });
      this.collection.total_user_entries = 0;
      this.collection.reset([]);

      expect(this.view._isBlockEnabled('no_datasets')).toBe(true);
    });

    it('should show empty datasets when visits library and user didn\'t have any dataset', function () {
      this.router.model.set({ content_type: 'datasets', library: true });
      this.collection.total_user_entries = 0;
      this.collection.reset([]);

      expect(this.view._isBlockEnabled('no_datasets')).toBe(true);
    });

    it('should show onboarding map when collection is empty and content_type is in maps', function () {
      spyOn(cdb, 'createVis'); // mock the fallback map
      this.router.model.set({ content_type: 'maps' }, { silent: true });
      this.collection.reset([]);

      expect(this.view._isBlockEnabled('no_results')).toBe(false);
      expect(this.view._isBlockEnabled('onboarding')).toBe(true);
      expect(cdb.createVis).toHaveBeenCalled();
    });

    it('should show loading library when collection is empty and trying to see library', function () {
      this.router.model.set({ library: true, shared: 'no' }, { silent: true });
      this.collection.reset([]);

      expect(this.view._isBlockEnabled('loading_library')).toBe(true);
      expect(this.view._isBlockEnabled('no_datasets')).toBe(false);
    });

    it('should show no_results block when collection is empty and any of the filters are enabled', function () {
      this.router.model.set({ content_type: 'datasets', tag: 'jar' }, { silent: true });
      this.collection.reset([]);

      expect(this.view._isBlockEnabled('no_results')).toBe(true);

      this.router.model.set({ q: 'paco' }, { silent: true });
      this.collection.reset([]);

      expect(this.view._isBlockEnabled('no_results')).toBe(true);
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
    window.defaultFallbackBasemapTemplateUrl = undefined;
    delete window.defaultFallbackBasemapTemplateUrl;
  });
});
