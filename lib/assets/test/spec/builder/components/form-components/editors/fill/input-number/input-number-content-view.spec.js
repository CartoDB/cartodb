var cdb = require('internal-carto.js');
var Backbone = require('backbone');
var InputNumberContentView = require('builder/components/form-components/editors/fill/input-number/input-number-content-view');

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

    it('should have calculated the right range', function () {
      expect(this.model.get('range')).toEqual([1, 100]);
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should not overwrite the range when not necessary', function () {
      this.model.set('range', [10, 12]);
      this.view.render();
      expect(this.model.get('range')).toEqual([10, 12]);
      this.view.render();
      expect(this.model.get('range')).toEqual([10, 12]);
    });

    it('should overwrite the range when necessary', function () {
      this.model.set('range', [10, 10]);
      this.view.render();
      expect(this.model.get('range')).not.toEqual([10, 10]);
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
