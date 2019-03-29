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
var REQUIRED_FUNCTIONS = [
  'breadcrumbTitle',
  'isBreadcrumbDropdownEnabled',
  'isDisplayingDatasets',
  'isDisplayingMaps',
  'isDisplayingLockedItems'
];

module.exports = function () {
  REQUIRED_FUNCTIONS.forEach(function (functionName) {
    it('should have a ' + functionName + 'function', function () {
      expect(this.viewModel[functionName]).toEqual(jasmine.any(Function));
    });
  }, this);
};
