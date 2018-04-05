const HeaderViewModel = require('dashboard/views/account/header-view-model');
const headerViewModelTests = require('../../shared/header-view-model');

describe('dashboard/views/account/header-view-model', function () {
  beforeEach(function () {
    this.viewModel = new HeaderViewModel();
  });

  headerViewModelTests.call(this);

  describe('.breadcrumbTitle', function () {
    it('should always return a string', function () {
      expect(this.viewModel.breadcrumbTitle()).toEqual(jasmine.any(String));
    });

    it('should always return "Configuration"', function () {
      expect(this.viewModel.breadcrumbTitle()).toBe('Configuration');
    });
  });

  describe('.isDisplayingDatasets', function () {
    it('should always return false', function () {
      expect(this.viewModel.isDisplayingDatasets()).toBeFalsy();
    });
  });

  describe('.isDisplayingMaps', function () {
    it('should always return false', function () {
      expect(this.viewModel.isDisplayingMaps()).toBeFalsy();
    });
  });

  describe('.isDisplayingLockedItems', function () {
    it('should always return false', function () {
      expect(this.viewModel.isDisplayingLockedItems()).toBeFalsy();
    });
  });
});
