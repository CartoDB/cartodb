describe('Boolean field', function() {
  var view;
  
  beforeEach(function() {
    view = new cdb.admin.BooleanField({
      model: new cdb.core.Model({
        attribute:  'boolean',
        value:      null
      })
    });
  });

  it("should render three radio buttons and one selected", function() {
    view.render();
    expect(view.$el.find('a.radiobutton').size() == 3).toBeTruthy();
    expect(view.$el.find('a.radiobutton.null').hasClass('selected')).toBeTruthy();
  });

  it("should render a readonly input and don't trigger any event", function() {
    view.options.readOnly = true;
    view.render();
    
    var $true = view.$el.find('a.radiobutton.true');
    spyOn(view, '_onChange');
    
    $true.trigger(jQuery.Event( 'click' ));

    expect(view._onChange).not.toHaveBeenCalled();
    expect(view.$el.find('a.radiobutton.disabled').size() == 3).toBeTruthy();
  });

  it("should be valid selecting other value", function() {
    view.render();
    var $true = view.$el.find('a.radiobutton.true')
      , $null = view.$el.find('a.radiobutton.null');

    $true.trigger(jQuery.Event( 'click' ));

    expect(view.isValid()).toBeTruthy();
    expect($true.hasClass('selected')).toBeTruthy();
    expect($null.hasClass('selected')).toBeFalsy();
    expect(view.model.get('value')).toBe('true');
  });
});