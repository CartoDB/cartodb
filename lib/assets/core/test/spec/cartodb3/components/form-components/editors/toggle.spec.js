var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');

var OPTIONS = [{
  type: 'normal',
  label: 'normal',
  selected: true
}, {
  type: 'advance',
  label: 'advance',
  selected: false
}];

describe('components/form-components/editors/toggle', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({ context: 'normal' });

    this.form = new Backbone.Form({
      model: this.model
    });

    this.view = new Backbone.Form.editors.Toggle({
      key: 'context',
      form: this.form,
      schema: {
        options: _.map(OPTIONS, function (d) {
          return {
            val: d.type,
            label: d.label,
            selected: d.selected
          };
        }, this)
      }
    });

    this.view.render();
  });

  it('should render the toggle links for the options that are not selected', function () {
    expect(this.view.$('label').length).toBe(1);
  });

  it('should render the radios', function () {
    expect(this.view.$('input[type="radio"]').length).toBe(2);
    expect($(this.view.$('input[type="radio"]').get(0)).val()).toBe('normal');
  });

  it('should return the right value', function () {
    // trigger click in the radius despite it is hidden,
    // actually you have to click the label in the UI
    $(this.view.$('input[type="radio"]').get(1)).click();
    expect(this.view.getValue()).toBe('advance');
  });

  afterEach(function () {
    this.view.remove();
  });
});
