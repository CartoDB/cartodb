var Backbone = require('backbone');
var FactoryModals = require('../../../factories/modals');

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

    this._userModel = {
      featureEnabled: function () { return true; }
    };

    this._schema = {
      configModel: {},
      query: 'SELECT * from table',
      options: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ]
    };

    this.modals = FactoryModals.createModalService();

    this.view = new Backbone.Form.editors.Fill({
      key: 'stroke',
      userModel: this._userModel,
      modals: this.modals,
      schema: this._schema,
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
          modals: this.modals,
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

    describe('setting an image', function () {
      beforeEach(function () {
        this.model = new Backbone.Model({
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
              fixed: '#f1f1f1',
              opacity: 0.5
            },
            size: {
              fixed: 10
            }
          }
        });

        this.view = new Backbone.Form.editors.Fill({
          key: 'fill',
          userModel: this._userModel,
          modals: this.modals,
          schema: this._schema,
          model: this.model
        });

        this.color = this.view._inputCollection.findWhere({ type: 'color' });
        this.size = this.view._inputCollection.findWhere({ type: 'size' });
      });

      it('should adjust the min image size if it\'s too small', function () {
        this.color.set('image', 'test.png');

        expect(this.size.get('fixed')).toBe(20);
      });

      it('shouldn\'t adjust the image size if its big enough', function () {
        this.size.set({ fixed: 30 }, { silent: true });
        this.color.set('image', 'dog.png');

        expect(this.size.get('fixed')).toBe(30);
      });

      it('shouldn\'t adjust the image size if there was already an image set', function () {
        this.size.set({ fixed: 1 }, { silent: true });
        this.color.set({ image: 'duck.png' }, { silent: true });
        this.color.set('image', 'cat.png');

        expect(this.size.get('fixed')).toBe(1);
      });
    });

    describe('setting images', function () {
      beforeEach(function () {
        this.model = new Backbone.Model({
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
              fixed: '#f1f1f1',
              opacity: 0.5
            },
            size: {
              fixed: 10
            }
          }
        });

        this.view = new Backbone.Form.editors.Fill({
          key: 'fill',
          userModel: this._userModel,
          modals: this.modals,
          schema: this._schema,
          model: this.model
        });

        this.color = this.view._inputCollection.findWhere({ type: 'color' });
        this.size = this.view._inputCollection.findWhere({ type: 'size' });
      });

      it('should adjust the min image size if it\'s too small', function () {
        this.color.set('images', ['test.png']);

        expect(this.size.get('fixed')).toBe(20);
      });

      it('shouldn\'t adjust the image size if its big enough', function () {
        this.size.set({ fixed: 30 }, { silent: true });
        this.color.set('images', ['test.png']);

        expect(this.size.get('fixed')).toBe(30);
      });

      it('shouldn\'t adjust the image size if there was already an image set', function () {
        this.size.set({ fixed: 1 }, { silent: true });
        this.color.set({ images: ['duck.png', 'ping.jpg'] }, { silent: true });
        this.color.set('images', ['duck.png', 'ping.jpg', 'cat.gif']);

        expect(this.size.get('fixed')).toBe(1);
      });

      it('shouldn\'t adjust the image size when no image is set', function () {
        this.size.set({ fixed: 1 }, { silent: true });
        this.color.set('images', ['']);

        expect(this.size.get('fixed')).toBe(1);
      });
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
