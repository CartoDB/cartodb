var cdb = require('cartodb.js-v3');
var EditFieldModel = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_model');
var StringFieldView = require('../../../../../javascripts/cartodb/common/edit_fields/string_field/string_field_view');

describe('common/edit_fields/string_field', function() {

  beforeEach(function() {
    this.model = new EditFieldModel({
      type: 'string',
      attribute: 'string_column',
      value: 'hellop'
    })
    this.view = new StringFieldView({
      model: this.model
    });
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('textarea.js-textarea').length).toBe(1);
    expect(this.view.$('textarea.js-textarea').val()).toBe("hellop");
  });

  it("should change model value when user types something", function() {
    var self = this;

    this.view.$('.js-textarea')
      .val("another text")
      .trigger({type: 'keyup', which: 27, keyCode: 27})
      .trigger({type: 'keydown', which: 13, keyCode: 13});
    expect(this.model.get('value')).toBe("another text");
  });

  it("should disable textarea when readOnly is true", function() {
    this.model.set('readOnly', true);
    expect(this.view.$('.js-textarea[readonly]').length).toBe(1);
    this.view.$('.js-textarea')
      .focusin()
      .trigger({type: 'keydown', which: 78, keyCode: 78}) // 'n'
      .trigger({type: 'keydown', which: 13, keyCode: 13});
    expect(this.view.$('.js-textarea').val()).toBe("hellop");
  });

  it("should resize textarea when option is enabled", function() {
    spyOn(this.view, '_resize');
    this.view.$('.js-textarea').trigger({ type: 'keyup', which: 27, keyCode: 27 });
    expect(this.view._resize).toHaveBeenCalled();
  });

  it("shouldn't resize textarea when option is disabled", function() {
    this.view.options.autoResize = false;
    spyOn(this.view, '_resize');
    this.view.$('.js-textarea').trigger({ type: 'keydown', which: 13, keyCode: 13 });
    expect(this.view._resize).not.toHaveBeenCalled();
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});