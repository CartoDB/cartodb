var InputColorCategories = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-categories/input-color-categories');

describe('components/form-components/editors/fill/input-color/input-ramps/input-color-ramps', function () {
  beforeEach(function () {
    this.model = new cdb.core.Model({
      domain: ['One', 'Two', 'Three'],
      range: ['#F1EEF6', '#D4B9DA', '#C994C7'],
      attribute: 'column1',
      quantification: 'jenks'
    });

    this.view = new InputColorCategories(({
      model: this.model,
      query: 'SELECT * FROM table',
      columns: ['column1', 'column2', 'column3'],
      configModel: {}
    }));

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.html()).toContain('column1');
    expect(this.view.$el.html()).toContain('One');
    expect(this.view.$('.RampItem-bar:eq(0)').css('background-color')).toBe('rgb(241, 238, 246)');

    expect(this.view.$el.html()).toContain('Two');
    expect(this.view.$('.RampItem-bar:eq(1)').css('background-color')).toBe('rgb(212, 185, 218)');

    expect(this.view.$el.html()).toContain('Three');
    expect(this.view.$('.RampItem-bar:eq(2)').css('background-color')).toBe('rgb(201, 148, 199)');

    expect(this.view.$('.js-loader').hasClass('is-hidden')).toBeTruthy();
    expect(this.view.$('.js-content').hasClass('is-hidden')).toBeFalsy();
  });

  it('should show the loader', function () {
    this.model.set('attribute', 'column2');
    expect(this.view.$('.js-loader').hasClass('is-hidden')).toBeFalsy();
    expect(this.view.$('.js-content').hasClass('is-hidden')).toBeTruthy();
  });

  afterEach(function () {
    this.view.remove();
  });
});
