var EditFieldModel = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_model');
var NumberFieldView = require('../../../../../javascripts/cartodb/common/edit_fields/number_field/number_field_view');

describe('common/edit_fields/number_field', function() {

  beforeEach(function() {
    this.model = new EditFieldModel({
      type: 'number',
      attribute: 'number_column',
      value: 2.34545
    })
    this.view = new NumberFieldView({
      model: this.model
    });
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-input').val()).toBe('2.34545');
    expect(this.view.$('.js-input').hasClass('is-number')).toBeTruthy();
  });

  it("should change model value when user types something", function() {
    this.view.$('.js-input')
      .val('-234.2')
      .trigger({type: 'keyup', which: 78, keyCode: 78})
      .trigger({type: 'keydown', which: 13, keyCode: 13});
    expect(this.model.get('value')).toBe('-234.2');
  });

  it("should show invalid class when number value is invalid", function() {
    this.view.$('.js-input')
      .val('paco')
      .trigger({type: 'keyup', which: 78, keyCode: 78})
      .trigger({type: 'keydown', which: 13, keyCode: 13});
    expect(this.model.get('value')).toBe(2.34545);
    expect(this.view.$el.hasClass('is-invalid')).toBeTruthy();
  });

  it("should disable input when readOnly is true", function() {
    this.model.set('readOnly', true);
    this.view.$('.js-input')
      .focusin()
      .trigger({type: 'keyup', which: 78, keyCode: 78}) // 'n'
      .trigger({type: 'keydown', which: 13, keyCode: 13});
    expect(this.view.$('.js-input').val()).toBe("2.34545");
    expect(this.model.get('value')).toBe(2.34545);
    expect(this.view.$('.js-input').hasClass('is-disabled')).toBeTruthy();
  });

  it("should store null value when input is empty", function() {
    this.view.$('.js-input').val('');
    this.view.$('.js-input').trigger('keyup');
    expect(this.model.get('value')).toBeNull();
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});