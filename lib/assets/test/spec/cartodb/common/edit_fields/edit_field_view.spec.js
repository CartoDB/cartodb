var cdb = require('cartodb.js-v3');
var EditFieldModel = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_model');
var EditFieldView = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_view');

describe('common/edit_fields/edit_field', function() {

  beforeEach(function() {
    this.model = new EditFieldModel({
      type: 'number',
      attribute: 'hello',
      value: 1
    });
    spyOn(this.model, 'bind').and.callThrough();
    this.view = new EditFieldView({
      model: this.model
    });
    this.view.render();
  });

  it("should have two bindings by default", function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('error valid');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('change:readOnly');
  });

  it("should add invalid class when model throws an error", function() {
    this.model.set('value', 'addd'); // A non valid value
    expect(this.view.$el.hasClass('is-invalid')).toBeTruthy();
  });

  it("should return model validity with a public method", function() {
    // Method has to be there, that's all.
    expect(this.view.isValid).not.toBeUndefined();
    spyOn(this.model, 'isValid');
    this.view.isValid();
    expect(this.model.isValid).toHaveBeenCalled();
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});