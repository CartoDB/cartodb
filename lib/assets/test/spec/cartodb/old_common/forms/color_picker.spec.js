describe('ColorPicker', function() {

  var view, target;

  beforeEach(function() {
    target = $('<a>');
    view = new cdb.admin.ColorPicker({
      target:       target,
      imagePicker:  false,
      kind:         'marker'
    });

  });

  afterEach(function() {
    view.clean();
  });

  it("should render properly", function() {
    view.render();
    expect(view.$('a.advanced').length).toBe(1);
    expect(view.$('ul.default-colors > li').length).toBe(30);
    expect(view.$('.image_picker a').is(':visible')).toBeFalsy();
  });

  it("should show advanced picker", function() {
    view.render();
    spyOn(view, 'positionate');
    view.$('a.advanced').click();
    expect(view.positionate).toHaveBeenCalled();
    expect(view.$('.top').hasClass('advanced')).toBeTruthy();
  });

  it("should trigger color when submit form", function() {
    view.render();

    var trigger = false;

    view.bind('colorChosen', function() {
      trigger = true;
    });

    view.$('input.text').val('white');
    view.$('form').submit();

    expect(trigger).toBeTruthy();

    trigger = false;

    view.$('input.text').val('what?');
    view.$('form').submit();

    expect(trigger).toBeFalsy();        
  });

  it("should change color when is selected from the list", function() {
    view.render();
    var trigger = false;
    view.bind('colorChosen', function() {
      trigger = true;
    });
    var color = view.$('input.text').val();
    view.$('ul li:eq(3) a').click();
    expect(view.$('input.text').val()).toBe(color);
    expect(trigger).toBeTruthy();
  });

  it("should render again when colors or extra_colors attributes have changed", function() {
    view.render();
    spyOn(view, 'render');
    view.setColors('colors', []);
    expect(view.$('ul.default-colors li').length).toBe(0);
    view.setColors('visible', false);
    expect(view.render).not.toHaveBeenCalled();
  });
  
});