var HeaderViewModel = require('../../../../javascripts/cartodb/keys/header_view_model');
var sharedTests = require('../common/views/dashboard_header/shared_for_view_model');

describe('keys/header_view_model', function() {
  beforeEach(function() {
    this.viewModel = new HeaderViewModel();
  });

  sharedTests.call(this);

  describe('.breadcrumbTitle', function() {
    it('should always return a string', function() {
      expect(this.viewModel.breadcrumbTitle()).toEqual(jasmine.any(String));
    });
  });

  describe('.isDisplayingDatasets', function() {
    it('should always return false', function() {
      expect(this.viewModel.isDisplayingDatasets()).toBeFalsy();
    });
  });

  describe('.isDisplayingMaps', function() {
    it('should always return false', function() {
      expect(this.viewModel.isDisplayingMaps()).toBeFalsy();
    });
  });

  describe('.isDisplayingLockedItems', function() {
    it('should always return false', function() {
      expect(this.viewModel.isDisplayingLockedItems()).toBeFalsy();
    });
  });
});
