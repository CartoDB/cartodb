var cdb = require('cartodb.js-v3');
var EditFieldModel = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_model');
var BooleanFieldView = require('../../../../../javascripts/cartodb/common/edit_fields/boolean_field/boolean_field_view');

describe('common/edit_fields/boolean_field', function() {

  beforeEach(function() {
    this.model = new EditFieldModel({
      type: 'boolean',
      attribute: 'boolean_column',
      value: null
    })
    this.view = new BooleanFieldView({
      model: this.model
    });
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('.RadioButton').length).toBe(3);
    expect(this.view.$('.RadioButton-input.is-checked').length).toBe(1);
    expect(this.view.$('.RadioButton-input.is-checked').next().text()).toBe('Null');
  });

  it("should change model when options have changed", function() {
    this.view.$('.js-true').click();
    expect(this.model.get('value')).toBe(true);
    expect(this.view.$('.RadioButton-input.is-checked').length).toBe(1);
    expect(this.view.$('.RadioButton-input.is-checked').next().text()).toBe('True');
    this.view.$('.js-false').click();
    expect(this.model.get('value')).toBe(false);
    expect(this.view.$('.RadioButton-input.is-checked').next().text()).toBe('False');
  });

  it("should disable radio buttons when readOnly is true", function() {
    this.model.set('readOnly', true);
    expect(this.view.$('.RadioButton.is-disabled').length).toBe(3);
    expect(this.view.$('.RadioButton-input.is-checked').length).toBe(1);
    this.view.$('.js-true').click();
    expect(this.model.get('value')).toBe(null);
    expect(this.view.$('.RadioButton-input.is-checked').next().text()).toBe('Null');
    this.view.$('.js-false').click();
    expect(this.model.get('value')).toBe(null);
    expect(this.view.$('.RadioButton-input.is-checked').next().text()).toBe('Null');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});