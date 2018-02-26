var Backbone = require('backbone');
var InputNumberValueContentView = require('builder/components/form-components/editors/fill/input-number/input-number-value-content-view');

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

    it('should render the quantification list', function () {
      this.view.$('.js-quantification').click();
      expect(this.view.$el.html()).toContain('form-components.editors.fill.quantification.title');
      expect(this.view.$('.js-listItem').length).toBe(4);
    });

    it('should render the bins list', function () {
      this.view.$('.js-bins').click();
      expect(this.view.$el.html()).toContain('form-components.editors.fill.bins');
      expect(this.view.$('.js-listItem').length).toBe(6);
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('on a model with a range but without a defined bins count', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
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

    it('should set the default bins count to 5', function () {
      expect(+this.model.get('bins')).toBe(5);
    });

    it('should render properly', function () {
      expect(this.view.$el.html()).toContain('age');
      expect(this.view.$el.html()).toContain('form-components.editors.fill.quantification.methods.jenks');
      expect(this.view.$el.html()).toContain('5 form-components.editors.fill.input-ramp.buckets');
      expect(this.view.$el.html()).toContain('Max');
      expect(this.view.$el.html()).toContain('Min');
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
