describe('Date field', function() {
  var view;

  beforeEach(function() {
    view = new cdb.admin.DateField({
      model: new cdb.core.Model({
        attribute:  'date',
        value:      '2012-12-12T10:10:10+02:00'
      })
    });
  });

  it("should render one combo, two spinners and one input with their correct values applied", function() {
    view.render();
    expect(view.$el.find('input.time').size()).toBe(1);
    expect(view.$el.find('input.time').val()).toBe('10:10:10');

    expect(view.$el.find('.form_spinner').size()).toBe(2);
    expect(view.$el.find('.form_spinner.day input').val()).toBe('12');
    expect(view.$el.find('.form_spinner.year input').val()).toBe('2012');

    expect(view.$el.find('.form_combo .select2-container').size()).toBe(1);
    expect(view.$el.find('.form_combo .select2-container .select2-choice span').text()).toBe('December');
  });

  it("should create a valid internal date model", function() {
    view.render();
    expect(view.date_model.get('year')).toBe(2012);
    expect(view.date_model.get('month')).toBe(12);
    expect(view.date_model.get('day')).toBe(12);
    expect(view.date_model.get('time')).toBe('10:10:10');
  });

  it("should render a readonly form and don't trigger any event", function() {
    view.options.readOnly = true;
    view.render();

    var $time   = view.$el.find('input.time')
      , $day    = view.$el.find('.form_spinner.day input')
      , $month  = view.$el.find('.select2-choice');

    spyOn(view, '_onKeyUp');
    spyOn(view, '_onChangeModel');

    $time.trigger(jQuery.Event( 'keyup', {
      keyCode: 21
    }));

    $month.trigger(jQuery.Event( 'click' ));
    $day.val('20');

    expect(view._onChangeModel).not.toHaveBeenCalled();
    expect(view._onKeyUp).not.toHaveBeenCalled();
    expect($time.attr('readonly')).toBeTruthy();
    expect(view.date_model.get('day')).toBe(12);
  });

  it("should be invalid adding a string in the time input", function() {
    view.render();
    var $time = view.$el.find('input.time');
    $time.val('testing');
    $time.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeFalsy();
    expect($time.hasClass('error')).toBeTruthy();
    expect(view.date_model.get('time')).toBe('10:10:10');
  });

  it("should store a valid time", function() {
    view.render();
    var $time = view.$el.find('input.time');
    $time.val('02:02:02');
    $time.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.isValid()).toBeTruthy();
    expect($time.hasClass('error')).toBeFalsy();
    expect(view.date_model.get('time')).toBe('02:02:02');
    expect(view.model.get('value')).toBe('2012-12-12T02:02:02+02:00');
  });

  it("should return a 00:00 timezone if none is provided", function() {

    var view = new cdb.admin.DateField({
      model: new cdb.core.Model({
        attribute:  'date',
        value:      '2012-12-12T10:10:10'
      })
    });

    view.render();

    var $time = view.$el.find('input.time');
    $time.val('10:04:12');
    $time.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.model.get('value')).toBe('2012-12-12T10:04:12+00:00');

  });

  it("should return the same timezone as provided", function() {

    var view = new cdb.admin.DateField({
      model: new cdb.core.Model({
        attribute:  'date',
        value:      '2012-12-12T10:10:10+03:00'
      })
    });

    view.render();

    var $time = view.$el.find('input.time');
    $time.val('10:04:12');
    $time.trigger(jQuery.Event( 'keyup', { keyCode: 11 } ));

    expect(view.model.get('value')).toBe('2012-12-12T10:04:12+03:00');

  });

  it("should trigger event if ENTER is pressed", function() {
    view.render();
    var $input = view.$el.find('input.time');
    spyOn(view, '_triggerEvent');
    $input.trigger(jQuery.Event( 'keyup', {
      keyCode: 13
    }));

    expect(view._triggerEvent).toHaveBeenCalled();
  });
});
