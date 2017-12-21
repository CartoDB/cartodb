describe('Geometry field', function() {
  var view;
  
  beforeEach(function() {
    view = new cdb.admin.GeometryField({
      row: new cdb.admin.Row({
        cartodb_id: '1',
        c1: 'jamon',
        c2: 10,
        c3: false,
        c4: '2012-10-10T10:10:10+02:00',
        the_geom: '{ "type": "Point", "coordinates": [100.0, 0.0] }'
      }),
      model: new cdb.core.Model({
        attribute:  'goemetry',
        value:      '{ "type": "Point", "coordinates": [100.0, 0.0] }'
      })
    });
  });

  it("should render a selector, two inputs and a textarea, applying the correct values", function() {
    view.render();
    expect(view.$el.find('input').size()).toBe(2);
    expect(view.$el.find('input.longitude').val()).toBe('100');
    expect(view.$el.find('input.latitude').val()).toBe('0');
    
    expect(view.$el.find('textarea').size()).toBe(1);
    expect(view.$el.find('textarea').val()).toBe('{"type":"Point","coordinates":[100,0]}');

    expect(view.$el.find('.selector').size()).toBe(1);
    expect(view.$el.find('.selector .switch').hasClass('enabled')).toBeFalsy();
  });


  it("should render a readonly textarea and don't trigger any event", function() {
    view.options.readOnly = true;
    view.render();
    

    var $rest = view.$('textarea');
    
    spyOn(view, '_onKeyTextareaDown');
    
    $rest.trigger(jQuery.Event( 'keydown', {
      keyCode: 21
    }));

    expect(view._onKeyTextareaDown).not.toHaveBeenCalled();
    expect($rest.attr('readonly')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');
  });

  it("should be invalid adding a string in the longitude input", function() {
    view.render();
    var $lon = view.$('input.longitude');
    $lon.val('testing');
    $lon.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($lon.hasClass('error')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');
  });

  it("should be invalid adding a longitude value bigger than 90 or fewer than -90", function() {
    view.render();
    var $lon = view.$('input.latitude');
    $lon.val(92);
    $lon.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($lon.hasClass('error')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');

    $lon.val(-91);
    $lon.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($lon.hasClass('error')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');
  });

  it("should be invalid adding a longitude value bigger than 180 or fewer than -180", function() {
    view.render();
    var $lon = view.$('input.longitude');
    $lon.val(181);
    $lon.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($lon.hasClass('error')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');

    $lon.val(-181);
    $lon.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($lon.hasClass('error')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');
  });

  it("should be invalid adding a string in the latitude input", function() {
    view.render();
    var $lat = view.$('input.latitude');
    $lat.val('testing');
    $lat.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($lat.hasClass('error')).toBeTruthy();
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.0] }');
  });

  it("should be valid adding a string in the longitude input but changing to geometry free editor", function() {
    view.render();
    var $lon = view.$('input.longitude');
    $lon.val('testing');
    $lon.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));
    expect(view.isValid()).toBeFalsy();

    view.$('a.switch').click();
    expect(view.isValid()).toBeTruthy();
    var $textarea = view.$('textarea');
    $textarea
      .val('{ "type": "Point", "coordinates": [100.0, 0.10] }')
      .trigger(jQuery.Event( 'keydown', { keyCode: 11 } ));
    expect(view.model.get('value')).toBe('{ "type": "Point", "coordinates": [100.0, 0.10] }');
  });

  it("should be valid adding a correct latitude and longitude", function() {
    view.render();
    var $lat = view.$('input.latitude');
    $lat.val('10.3');
    $lat.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeTruthy();
    expect($lat.hasClass('error')).toBeFalsy();
    expect(view.model.get('value')).toBe('{"type":"Point","coordinates":[100,10.3]}');
  });

  it("should trigger event if ENTER is pressed", function() {
    view.render();
    var $input = view.$('input.longitude');
    spyOn(view, '_triggerEvent');
    $input.trigger(jQuery.Event( 'keyup', {
      keyCode: 13
    }));

    expect(view._triggerEvent).toHaveBeenCalled();
  });

  it("should trigger event if ENTER + CMD || ENTER + Ctrl is pressed", function() {
    view.render();
    var $textarea = view.$('textarea');
    spyOn(view, '_triggerEvent');
    $textarea.trigger(jQuery.Event( 'keydown', {
      metaKey: true,
      ctrlKey: true,
      keyCode: 13
    }));

    expect(view._triggerEvent).toHaveBeenCalled();
  });
});

