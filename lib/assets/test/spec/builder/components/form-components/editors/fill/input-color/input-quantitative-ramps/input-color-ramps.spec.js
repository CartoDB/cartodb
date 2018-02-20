var Backbone = require('backbone');
var InputColorRamps = require('builder/components/form-components/editors/fill/input-color/input-quantitative-ramps/main-view');

describe('components/form-components/editors/fill/input-color/input-quantitative-ramps/main-view', function () {
  describe('on model with a range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 7,
        range: ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
        attribute: 'column1',
        quantification: 'jenks'
      });

      this.view = new InputColorRamps(({
        model: this.model
      }));

      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$el.html()).toContain('column1');
      expect(this.view.$el.html()).toContain('7 form-components.editors.fill.input-ramp.buckets');
      expect(this.view.$el.html()).toContain('form-components.editors.fill.quantification.methods.jenks');
    });

    it('should pick a similar ramp when changing bins', function () {
      this.model.set('bins', 5);
      expect(this.model.get('range').join(',').toLowerCase()).toBe('#f1eef6,#d7b5d8,#df65b0,#dd1c77,#980043');
    });

    it('should refresh when the attribute is changed', function () {
      this.model.set('attribute', 'column2');
      expect(this.view.$el.html()).toContain('column2');
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('model without previous range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        fixed: '#FF0000'
      });

      this.view = new InputColorRamps(({
        model: this.model
      }));
    });

    it('should initialize the model with default values', function () {
      expect(this.model.get('quantification')).toBe('quantiles');
      expect(this.model.get('bins')).toBe('5');
      expect(this.model.get('fixed')).toBe(undefined);
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('model with previous bins', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 12
      });

      this.view = new InputColorRamps(({
        model: this.model
      }));
    });

    it('should set a default number of bins based on the current ramp list', function () {
      expect(this.model.get('bins')).toBe('7');
    });

    afterEach(function () {
      this.view.remove();
    });
  });

  describe('model without valid range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        range: ['#F1EEF6']
      });

      this.view = new InputColorRamps(({
        model: this.model
      }));
    });

    it('should set a default ramp list', function () {
      expect(this.model.get('bins')).toBe('5');
      expect(this.model.get('range').length).toBe(5);
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    afterEach(function () {
      this.view.remove();
    });
  });
});
