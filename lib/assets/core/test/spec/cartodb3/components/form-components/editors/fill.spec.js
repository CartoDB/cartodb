var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base.js');
require('../../../../../../javascripts/cartodb3/components/form-components/editors/fill.js');

describe('components/form-components/editors/fill', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe',
      stroke: {
        size: {
          range: [1, 30],
          attribute: 'the_geom',
          quantification: 'Quantile'
        },
        color: {
          bins: 5,
          range: ['#FFFFFF', '#FABADA', '#00FF00', '#000000', '#999999'],
          attribute: 'column1',
          quantification: 'Jenks',
          opacity: 0.5
        }
      },
      fill: {
        color: {
          bins: 5,
          range: ['#FFFFFF', '#FABADA', '#00FF00', '#000000', '#999999'],
          attribute: 'column1',
          quantification: 'Jenks',
          opacity: 0.5
        },
        size: {
          range: [1, 30],
          attribute: 'the_geom',
          quantification: 'Quantile'
        }
      }
    });

    this.view = new Backbone.Form.editors.Fill({
      key: 'stroke',
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: {},
      schema: {
        configModel: {},
        query: 'SELECT * from table',
        options: [
          { label: 'column1', type: 'number' },
          { label: 'column2', type: 'number' },
          { label: 'column3', type: 'number' }
        ]
      },
      model: this.model
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.CDB-OptionInput-item').length).toBe(2);
    expect(this.view.$el.text()).toContain('1..30');
  });

  it('should render the input fields', function () {
    expect(this.view.$('.CDB-OptionInput-item').length).toBe(2);
  });

  it('should show the input fields correctly sorted', function () {
    expect(this.view.$('.CDB-OptionInput-item:first-child').text()).toContain('1..30');
    expect(this.view.$('.CDB-OptionInput-item:last-child').html()).toContain('rgba(255, 255, 255, 0.5),rgba(250, 186, 218, 0.5),rgba(0, 255, 0, 0.5),rgba(0, 0, 0, 0.5),rgba(153, 153, 153, 0.5)');
  });

  it('should open a fill dialog on click', function () {
    expect(this.view.$('.Editor-boxModal').length).toBe(0);
    this.view.$('.CDB-OptionInput-item:first-child').click();
    expect(this.view.$('.Editor-boxModal').length).toBe(1);
  });

  it('should render the size dialog component ', function () {
    this.view.$('.CDB-OptionInput-item:first-child').click();
    expect(this.view.$('.CDB-NavMenu-item').length).toEqual(2);
    expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.input-number.fixed');
    expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.input-number.value');
    expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.quantification.methods.quantiles');
    expect(this.view.$('.Editor-boxModal').text()).toContain('the_geom');
  });

  it('should render the color dialog component ', function () {
    this.view.$('.CDB-OptionInput-item:last-child').click();
    expect(this.view.$('.CDB-NavMenu-item').length).toEqual(2);
    expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.input-color.solid');
    expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.input-color.value');
    expect(this.view.$('.Editor-boxModal').text()).toContain('5 form-components.editors.fill.input-ramp.buckets');
    expect(this.view.$('.Editor-boxModal').text()).toContain('column1');
    expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.quantification.methods.jenks');
  });

  describe('hide panes', function () {
    beforeEach(function () {
      this.view = new Backbone.Form.editors.Fill({
        key: 'fill',
        schema: {
          configModel: {},
          userModel: {
            featureEnabled: function () { return true; }
          },
          modals: {},
          query: 'SELECT * FROM table',
          options: [
            { label: 'column1', type: 'number' },
            { label: 'column2', type: 'number' },
            { label: 'column3', type: 'number' }
          ],
          editorAttrs: {
            size: {
              hidePanes: ['fixed']
            },
            color: {
              hidePanes: ['fixed']
            }
          }
        },
        model: this.model
      });
      this.view.render();
    });

    it('should render the size dialog component ', function () {
      this.view.$('.CDB-OptionInput-item:first-child').click();
      expect(this.view.$('.CDB-NavMenu-item').length).toEqual(1);
      expect(this.view.$('.Editor-boxModal').text()).not.toContain('form-components.editors.fill.input-number.fixed');
      expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.input-number.value');
      expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.quantification.methods.quantiles');
      expect(this.view.$('.Editor-boxModal').text()).toContain('the_geom');
    });

    it('should render the color dialog component', function () {
      this.view.$('.CDB-OptionInput-item:last-child').click();
      expect(this.view.$('.CDB-NavMenu-item').length).toEqual(1);
      expect(this.view.$('.Editor-boxModal').text()).not.toContain('form-components.editors.fill.input-color.solid');
      expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.input-color.value');
      expect(this.view.$('.Editor-boxModal').text()).toContain('5 form-components.editors.fill.input-ramp.buckets');
      expect(this.view.$('.Editor-boxModal').text()).toContain('column1');
      expect(this.view.$('.Editor-boxModal').text()).toContain('form-components.editors.fill.quantification.methods.jenks');
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
