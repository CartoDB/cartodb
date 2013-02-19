describe('Number field', function() {
  var view;
  
  beforeEach(function() {
    view = new cdb.admin.NumberField({
      model: new cdb.core.Model({
        attribute:  'number',
        value:      6
      })
    });
  });

  it("should render an input", function() {
    view.render();
    expect(view.$el.find('input').size()).toBe(1);
    expect(view.$el.find('input').val()).toBe('6');
  });

  it("should render a readonly input and don't trigger any event", function() {
    view.options.readOnly = true;
    view.render();
    
    var $input = view.$el.find('input');
    spyOn(view, '_onKeyUp');
    
    $input.trigger(jQuery.Event( 'keyup', {
      keyCode: 21
    }));

    expect(view._onKeyUp).not.toHaveBeenCalled();
    expect(view.$el.find('input').attr('readonly')).toBeTruthy();
  });

  it("should be invalid adding a string", function() {
    view.render();
    var $input = view.$el.find('input');
    $input.val('testing');
    $input.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($input.hasClass('error')).toBeTruthy();
    expect(view.model.get('value') == "testing").toBeFalsy();
  });

  it("should be valid adding a number", function() {
    view.render();
    var $input = view.$el.find('input');
    $input.val(1000);
    $input.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeTruthy();
    expect($input.hasClass('error')).toBeFalsy();
    expect(view.model.get('value')).toBe('1000');
  });

  it("should trigger event if ENTER + CMD || ENTER + CTrl is keypressed", function() {
    view.render();
    var $input = view.$el.find('input');
    spyOn(view, '_triggerEvent');
    $input.trigger(jQuery.Event( 'keyup', {
      keyCode: 13
    }));

    expect(view._triggerEvent).toHaveBeenCalled();
  });
});