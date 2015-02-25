/**
 * Shared tests for a dashboard header view model
 *
 * Expected to be called within the scope of the test, e.g.:
 *  describe('./my_header_view_model', function() {}
 *    beforeEach(function() {
 *      this.viewModel = new MyHeaderViewModel({ ... })
 *    });
 *    sharedTests.call(this)
 */
module.exports = function() {

  [
    'breadcrumbTitle',
    'isBreadcrumbDropdownEnabled',
    'isDisplayingDatasets',
    'isDisplayingMaps',
    'isDisplayingLockedItems'
  ].forEach(function(fn) {
    it('should have a ' + fn + 'function', function() {
      expect(this.viewModel[fn]).toEqual(jasmine.any(Function));
    });
  }, this);

};
