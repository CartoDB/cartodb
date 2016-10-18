var Backbone = require('backbone');
var InputNumberValueContentView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-number/input-number-value-content-view');

describe('components/form-components/editors/fill/input-number/input-number-value-content-view', function () {
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

      var columns = [
        { label: 'cartodb_id', type: 'number', val: 'cartodb_id' },
        { label: 'the_geom', type: 'geometry', val: 'the_geom' },
        { label: 'address', type: 'string', val: 'address' },
        { label: 'age', type: 'number', val: 'age' }
      ];

      this.view = new InputNumberValueContentView({
        model: this.model,
        columns: columns,
        min: 0,
        max: 100
      });

      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$el.html()).toContain('age');
      expect(this.view.$el.html()).toContain('form-components.editors.fill.quantification.methods.jenks');
      expect(this.view.$el.html()).toContain('7 form-components.editors.fill.input-ramp.buckets');
      expect(this.view.$el.html()).toContain('Max');
      expect(this.view.$el.html()).toContain('Min');
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
