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
    spyOn(view, '_onKeyDown');

    $input.trigger(jQuery.Event( 'keydown', {
      keyCode: 21
    }));

    expect(view._onKeyDown).not.toHaveBeenCalled();
    expect(view.$el.find('input').attr('readonly')).toBeTruthy();
  });

  it("should be invalid adding a string", function() {
    view.render();
    var $input = view.$el.find('input');
    $input.val('testing');
    $input.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($input.hasClass('error')).toBeTruthy();
  });

  it("should be valid adding a number", function() {
    view.render();
    var $input = view.$el.find('input');
    $input.val(1000);
    $input.trigger(jQuery.Event( 'keydown', { keyCode: 13 } ));

    expect(view.isValid()).toBeTruthy();
    expect($input.hasClass('error')).toBeFalsy();
    expect(view.model.get('value')).toBe('1000');
  });

  it("should trigger event if ENTER is keypressed", function() {
    view.render();
    var $input = view.$el.find('input');
    spyOn(view, '_triggerEvent');
    $input.trigger(jQuery.Event( 'keydown', {
      keyCode: 13
    }));

    expect(view._triggerEvent).toHaveBeenCalled();
  });

  it("should be valid adding several numbers", function() {
    view.render();
    var $input = view.$el.find('input');
    $input.trigger(jQuery.Event( 'keyup', { keyCode: 49 } ));

    $input.val('1');
    expect(view.isValid()).toBeTruthy();
    expect($input.hasClass('error')).toBeFalsy();

    $input.val('1a');
    $input.trigger(jQuery.Event( 'keyup', { keyCode: 97 } ));

    expect(view.isValid()).toBeFalsy();
    expect($input.hasClass('error')).toBeTruthy();

    $input.val('1');
    $input.trigger(jQuery.Event( 'keyup', { keyCode: 46 } )); 
    
    expect(view.isValid()).toBeTruthy();
    expect($input.hasClass('error')).toBeFalsy();

    $input.trigger(jQuery.Event( 'keydown', { keyCode: 13 } )); 

    expect(view.model.get('value')).toBe('1')
  });
});
