var EditableField = require('../../../../javascripts/cartodb/new_common/editable_field');

function keyPressEvent(key, metaKey) {
  var event = jQuery.Event("keydown");
  event.which = key;
  event.keyCode = key;
  if (metaKey) {
    event.metaKey = true;
  }
  return event;
}

function type($textarea, word) {
  $textarea.val('wadus');

  // Trigger keydown events for each letter
  var letters = word.split('');
  for (var i = 0; i < letters.length; i++) {
    var keyCode = letters[i].charCodeAt(0)
    $textarea.trigger(keyPressEvent(keyCode));
  }
}

var ENTER_KEY_CODE = 13;
var ESC_KEY_CODE = 27;
var model, view;

beforeEach(function() {
  model = new Backbone.Model({
    description: ''
  });
  view = new EditableField({
    model: model,
    fieldName: 'description'
  });
  spyOn(Backbone, 'sync');
  spyOn(model, 'save').and.callThrough();
})

describe('new_common/editable_field', function() {

  it('should render the field when it has some value', function() {
    // Description might contain markdown
    model.set({description: '**wadus**'});

    view.render();

    expect(view.$('div').attr('title')).toEqual('wadus');
    expect(view.$('div p strong').html()).toEqual('wadus');
  });

  it('should render a textarea and allow editing when the field has no value', function() {
    view.render();

    expect(view.$('textarea').val()).toEqual('');
    expect(view.$('textarea').attr('placeholder')).toEqual('Add description...');
  });

  it('should edit and save the field', function() {
    view.render();

    expect(view.$('textarea').val()).toEqual('');

    // Type something
    type(view.$('textarea'), "wadus");

    // Hit enter
    view.$('textarea').trigger(keyPressEvent(ENTER_KEY_CODE));
  
    expect(view.$('div').attr('title')).toEqual('wadus');
    expect(view.$('div p').html()).toEqual('wadus');

    // Model has been saved
    expect(model.save).toHaveBeenCalled();
    expect(model.get('description')).toEqual('wadus');
  });

  it('should cancel editing if esc is pressed', function() {
    view.render();

    // Type something and hit escape
    type(view.$('textarea'), "wadus");
    view.$('textarea').trigger(keyPressEvent(ESC_KEY_CODE));

    expect(view.$('textarea').val()).toEqual('');

    // Model has not been updated
    expect(model.save).not.toHaveBeenCalled();
    expect(model.get('description')).toEqual('');
  })

  it('should introduce new lines if cmd+enter is pressed', function() {
    view.render();

    // Type something and hit cmd+enter to add a newline
    type(view.$('textarea'), "wadus");
    view.$('textarea').trigger(keyPressEvent(ENTER_KEY_CODE, true));

    expect(view.$('textarea').val()).toEqual("wadus\n");

    // Model has not been updated
    expect(model.save).not.toHaveBeenCalled();
    expect(model.get('description')).toEqual('');
  })

  it('should not save when the user hits enter and the field is empty', function() {
    view.render();

    view.$('textarea').trigger(keyPressEvent(ENTER_KEY_CODE));

    expect(view.$('textarea').val()).toEqual("");

    // Model has not been updated
    expect(model.save).not.toHaveBeenCalled();
  })
});

