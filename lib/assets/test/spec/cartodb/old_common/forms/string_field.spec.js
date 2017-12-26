describe('String field', function() {
  var view;
  
  beforeEach(function() {
    view = new cdb.admin.StringField({
      model: new cdb.core.Model({
        attribute:  'string',
        value:      'value'
      })
    });
  });

  it("should render a textarea with the correct value", function() {
    view.render();
    expect(view.$el.find('textarea').size()).toBe(1);
    expect(view.$el.find('textarea').val()).toBe('value');
  });

  it("should not render a label", function() {
    view.render();
    expect(view.$el.find('label').size()).toBe(0);
  });

  it("should render a label if it is specified", function() {
    view.options.label = true;
    view.render();
    expect(view.$el.find('label').size()).toBe(1);
  });

  it("should render a readonly textarea and don't trigger any event if it is readonly", function() {
    view.options.readOnly = true;
    view.render();
    
    var $textarea = view.$el.find('textarea');
    spyOn(view, '_onKeyDown');
    
    $textarea.trigger(jQuery.Event( 'keydown', {
      keyCode: 21
    }));

    expect(view._onKeyDown).not.toHaveBeenCalled();
    expect(view.$el.find('textarea').attr('readonly')).toBeTruthy();
  });

  it("should be valid with any change applied", function() {
    view.render();
    var $textarea = view.$el.find('textarea');
    $textarea.val('testing');
    $textarea.trigger(jQuery.Event( 'keydown', { which: $.ui.keyCode.ENTER } ));

    expect(view.isValid()).toBeTruthy();
    expect(view.model.get('value')).toBe("testing");
  });

  it("should trigger event if ENTER + CMD || ENTER + Ctrl is pressed", function() {
    view.render();
    var $textarea = view.$el.find('textarea');
    spyOn(view, '_triggerEvent');
    $textarea.trigger(jQuery.Event( 'keydown', {
      metaKey: true,
      ctrlKey: true,
      keyCode: 13
    }));

    expect(view._triggerEvent).toHaveBeenCalled();
  });
});