var ColorPickerView = require('../../../../javascripts/cartodb/organization/color_picker_view');

describe('organization/color_picker_view', function() {

  beforeEach(function() {
    this.view = new ColorPickerView({
      color: "#3E2"
    });
    this.view.render();
  });
  
  it("should render properly", function() {
    this.view.$el.click();
    expect(this.view.colorPicker).toBeDefined();
    expect(this.view.colorPicker.$('input.text').val()).toBe('#3E2');
  });

  it("should close the picker if it is already opened", function() {
    this.view.$el.click();
    expect(this.view.colorPicker).toBeDefined();
    this.view.$el.click();
    expect(this.view.colorPicker).not.toBeDefined();
  });

  it("should trigger a signal and change background color when a new color is chosen", function() {
    var color = this.view.model.get('color');
    this.view.bind('colorChosen', function(hex, mdl) {
      color = hex;
    })
    this.view.$el.click();
    this.view.colorPicker.$('li a[href="#A53ED5"]').click();
    expect(color).toBe('#A53ED5');
    expect(this.view.$el.css('background-color')).toBe('rgb(165, 62, 213)');
    expect(this.view.model.get('color')).toBe('#A53ED5');
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});