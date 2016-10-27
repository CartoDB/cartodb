var cdb = require('cartodb.js');
var Backbone = require('backbone');
var InputNumberContentView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-number/input-number-content-view');

describe('components/form-components/editors/fill/input-number/input-number-content-view', function () {
  describe('on model with a range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 7,
        range: [1, 100],
        attribute: 'age',
        quantification: 'jenks',
        selected: true,
        type: 'size'
      });

      this.min = 1;
      this.max = 45;

      this.view = new InputNumberContentView({
        stackLayoutModel: new cdb.core.Model(),
        model: this.model,
        min: this.min,
        max: this.max
      });

      this.view.render();
    });

    it('should calculate the right range', function () {
      var range = this.view._calculateRangeFromFixed(13.5);
      expect(range).toEqual([4, 22]);
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
