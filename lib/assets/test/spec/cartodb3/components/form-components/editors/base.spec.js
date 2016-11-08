var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base');

describe('components/form-components/editors/base', function () {
  beforeEach(function () {
    this.view = new Backbone.Form.editors.Base();
    this.view.options = {
      validators: ['required']
    }
  });

  it('should take default validation', function () {
    this.view._setOptions({
      schema: {
        min: 0,
        max: 10,
        step: 1,
        showSlider: true
      }
    });
    expect(this.view.options.validators.length).toBe(1);
    expect(this.view.options.validators[0]).toBe('required');
  });

  it('should take opts validation plus the default one', function () {
    this.view._setOptions({
      schema: {
        validators: [{
          type: 'regexp',
          regexp: /^[0-9]*\.?[0-9]*$/,
          message: 'Must be valid'
        }]
      }
    });
    expect(this.view.options.validators.length).toBe(2);
    expect(this.view.options.validators[0]).toBe('required');
    expect(this.view.options.validators[1].type).toBe('regexp');
  });
});
