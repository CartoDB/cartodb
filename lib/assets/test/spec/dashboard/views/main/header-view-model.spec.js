var HeaderViewModel = require('dashboard/views/main/header-view-model');
var Router = require('dashboard/common/router-dashboard');
var DashboardUrl = require('dashboard/data/dashboard-url-model');
var sharedTests = require('../../shared/header-view-model');

describe('dashboard/header_view_model', function () {
  beforeEach(function () {
    var dashboardUrl = new DashboardUrl({
      base_url: 'http://pepe.carto.com'
    });
    this.router = new Router({
      dashboardUrl: dashboardUrl
    });

    this.viewModel = new HeaderViewModel(this.router);
  });

  sharedTests.call(this);

  it('re-throws router change events', function () {
    this.viewModel.bind('change', function () {
      this.triggeredCallEvent = true;
    }, this);
    this.router.model.set('something', true);

    expect(this.triggeredCallEvent).toBeTruthy();
  });

  describe('.breadcrumbTitle', function () {
    describe('given no content type is set', function () {
      it('returns an empty string', function () {
        expect(this.viewModel.breadcrumbTitle()).toEqual('');
      });
    });

    describe('given is not viewing locked items', function () {
      it('returns current content type as a capitalized string', function () {
        this.router.model.set('content_type', 'datasets');
        expect(this.viewModel.breadcrumbTitle()).toEqual('Datasets');

        this.router.model.set('content_type', 'maps');
        expect(this.viewModel.breadcrumbTitle()).toEqual('Maps');
      });
    });

    describe('given is viewing locked items', function () {
      beforeEach(function () {
        this.router.model.set('locked', true);
      });

      it('returns the current content type prefixed with locked string', function () {
        this.router.model.set('content_type', 'datasets');
        expect(this.viewModel.breadcrumbTitle()).toEqual('Locked datasets');

        this.router.model.set('content_type', 'maps');
        expect(this.viewModel.breadcrumbTitle()).toEqual('Locked maps');
      });
    });
  });

  describe('.isDisplayingDatasets', function () {
    it('returns true if router model is set to datasets', function () {
      expect(this.viewModel.isDisplayingDatasets()).toBeFalsy();

      this.router.model.set('content_type', 'datasets');
      expect(this.viewModel.isDisplayingDatasets()).toBeTruthy();
    });
  });

  describe('.isDisplayingMaps', function () {
    it('returns true if router model is set to maps', function () {
      expect(this.viewModel.isDisplayingMaps()).toBeFalsy();

      this.router.model.set('content_type', 'maps');
      expect(this.viewModel.isDisplayingMaps()).toBeTruthy();
    });
  });

  describe('.isDisplayingLockedItems', function () {
    it('returns true if router model is set to maps', function () {
      expect(this.viewModel.isDisplayingLockedItems()).toBeFalsy();

      this.router.model.set('locked', true);
      expect(this.viewModel.isDisplayingLockedItems()).toBeTruthy();
    });
  });
});
