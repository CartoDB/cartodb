var widgetsTypes = require('../../../../../javascripts/cartodb3/editor/add-widgets/widgets-types');

describe('editor/add-widgets/widgets-types', function () {
  describe('all items', function () {
    it('should have a type prop', function () {
      widgetsTypes.forEach(function (d) {
        expect(d.type).toMatch(/\w+/);
      });
    });

    it('should have a createTabPaneItem method', function () {
      widgetsTypes.forEach(function (d) {
        expect(d.createTabPaneItem).toEqual(jasmine.any(Function));
      });
    });
  });
});
