var StateDefinitionModel = require('builder/data/state-definition-model');

describe('data/state-definition-model', function () {
  beforeEach(function () {
    var anObject = { something: 'something' };
    var visDefinitionModel = {};

    this.model = new StateDefinitionModel({
      json: JSON.stringify(anObject)
    }, {
      visDefinitionModel: visDefinitionModel
    });
  });

  describe('.setBounds', function () {
    it(' should trigger event when called', function () {
      jasmine.clock().install();

      var expectedBounds = [808];
      var actualBounds;
      function onBoundsSet (bounds) {
        actualBounds = bounds;
      }
      this.model.on('boundsSet', onBoundsSet);

      this.model.setBounds(expectedBounds);

      jasmine.clock().tick(10);
      expect(actualBounds[0]).toBe(expectedBounds[0]);

      jasmine.clock().uninstall();
    });
  });
});
