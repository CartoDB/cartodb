var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var MainView = require('../../../../javascripts/cartodb/dashboard/main_view_static');
var Router = require('../../../../javascripts/cartodb/dashboard/router');

describe('dashboard/main_view_static', function () {
  beforeEach(function () {
    this.$el = $('<div id="app"></div>');

    var collection = new cdb.admin.Visualizations();

    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      id: 1,
      api_key: 'hello-apikey'
    });

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });

    spyOn(MainView.prototype, '_initViews');

    this.view = new MainView({
      el: this.$el,
      collection: collection,
      user: this.user,
      config: {},
      router: this.router,
      assetsVersion: '1.0.0'
    });
  });

  describe('._initModels', function () {
    it('should init models', function () {
      expect(this.view.user).toBe(this.user);
      expect(this.view.router).toBe(this.router);
      expect(this.view.localStorage).toBeDefined();
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      MainView.prototype._initViews.and.callThrough();

      this.view._initViews();

      expect(_.size(this.view._subviews)).toBe(8);
    });
  });

  describe('is hosted', function () {
    describe('._initViews', function () {
      it('should init views', function () {
        MainView.prototype._initViews.and.callThrough();
        cdb.config.set('cartodb_com_hosted', true);

        this.view._initViews();

        expect(_.size(this.view._subviews)).toBe(7);
      });
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
