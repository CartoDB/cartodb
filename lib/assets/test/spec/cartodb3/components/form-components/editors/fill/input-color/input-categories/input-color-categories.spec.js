var Backbone = require('backbone');
var InputColorCategories = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-categories/input-color-categories');
var ConfigModel = require('../../../../../../../../../javascripts/cartodb3/data/config-model');

describe('components/form-components/editors/fill/input-color/input-ramps/input-color-ramps', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new Backbone.Model({
      domain: [0, '', 'Three'],
      range: ['#E7E1EF', '#C994C7', '#DD1C77'],
      attribute: 'column1',
      quantification: 'jenks'
    });

    this.view = new InputColorCategories(({
      model: this.model,
      query: 'SELECT * FROM table',
      columns: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ],
      configModel: this.configModel
    }));

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.html()).toContain('column1');

    expect(this.view.$('.js-listItem:eq(0)').text()).toContain('0');
    expect(this.view.$('.RampItem-bar:eq(0)').css('background-color')).toBe('rgb(231, 225, 239)');

    expect(this.view.$('.js-listItem:eq(1)').text()).toContain('null');
    expect(this.view.$('.RampItem-bar:eq(1)').css('background-color')).toBe('rgb(201, 148, 199)');

    expect(this.view.$('.js-listItem:eq(2)').text()).toContain('Three');
    expect(this.view.$('.RampItem-bar:eq(2)').css('background-color')).toBe('rgb(221, 28, 119)');

    expect(this.view.$('.js-loader').hasClass('is-hidden')).toBeTruthy();
    expect(this.view.$('.js-content').hasClass('is-hidden')).toBeFalsy();
  });

  it('should show the loader', function () {
    spyOn(this.view, '_startLoader');
    this.model.set('attribute', 'column2');
    expect(this.view._startLoader).toHaveBeenCalled();
  });

  afterEach(function () {
    this.view.remove();
  });
});
