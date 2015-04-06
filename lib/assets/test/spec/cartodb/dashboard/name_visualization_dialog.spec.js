describe("Name visualization dialog", function() {
  var name_dialog;

  beforeEach(function() {
    name_dialog = new cdb.admin.NameVisualization({ msg: 'Nothing' });
  });

  it("should render properly", function() {
    name_dialog.render();
    expect(name_dialog.$('input[type="text"]').length).toEqual(1);
    expect(name_dialog.$('input[type="text"]').attr('placeholder')).toEqual('Name your map');
    expect(name_dialog.$('div.info').length).toEqual(1);
  });

  it("should close and send the name if it is correct", function() {
    name_dialog.render();
    name_dialog.options.onResponse = function() {};

    var $input = name_dialog.$el.find('input');
    spyOn(name_dialog.options, 'onResponse');
    spyOn(name_dialog, 'hide');
    
    $input
      .val('jamon-testing')
      .trigger(jQuery.Event( 'keydown', {
          keyCode: 13
        })
      );

    expect(name_dialog.options.onResponse).toHaveBeenCalled();
    expect(name_dialog.hide).toHaveBeenCalled();
    expect(name_dialog.$('.info').hasClass('active')).toBeFalsy();
  });

  it("shouldn't close and send the name", function() {
    name_dialog.render();
    name_dialog.options.onResponse = function() {};

    var $input = name_dialog.$el.find('input');
    spyOn(name_dialog.options, 'onResponse');
    spyOn(name_dialog, 'hide');
    
    $input
      .val('')
      .trigger(jQuery.Event( 'keydown', {
          keyCode: 13
        })
      );

    expect(name_dialog.options.onResponse).not.toHaveBeenCalled();
    expect(name_dialog.hide).not.toHaveBeenCalled();
    expect(name_dialog.$('.info').hasClass('active')).toBeTruthy();
  });
  
});
