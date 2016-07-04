var EditableDescription = require('../../../../../javascripts/cartodb/dashboard/editable_fields/editable_description');

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
  $textarea.val(word);

  // Trigger keydown events for each letter
  var letters = word.split('');
  for (var i = 0; i < letters.length; i++) {
    var keyCode = letters[i].charCodeAt(0)
    $textarea.trigger(keyPressEvent(keyCode));
  }
}

describe('dashboard/editable_fields/editable_description', function() {

  var model, view;

  beforeEach(function() {
    model = new Backbone.Model({
      description: ''
    });
    view = new EditableDescription({
      model: model
    });
    spyOn(Backbone, 'sync');
    spyOn(model, 'save').and.callThrough();
  });

  it('should add the "EditableField" class to the element', function() {
    view.render();

    expect(view.el.classList).toContain('EditableField');
  });

  it('should render the field when it has some value', function() {
    // Description might contain markdown
    model.set({description: '**wadus**'});

    view.render();

    expect(view.$('.js-description').attr('title')).toEqual('wadus');
    expect(view.$('.js-description').html()).toEqual('wadus');
  });

  describe('if the field is editable', function(){

    beforeEach(function() {
      view = new EditableDescription({
        model: model,
        editable: true
      });
    });

    it('should render a button and edit and save the field when empty', function() {
      view.render();

      expect(view.el.classList).not.toContain('is-editing');
      expect(view.$('.js-field-input').val()).toEqual('');

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type something
      type(view.$('.js-field-input'), "wadus");

      // Hit enter
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(view.$('.js-description').attr('title')).toEqual('wadus');
      expect(view.$('.js-description').html()).toEqual('wadus');

      // Model has been saved
      expect(model.save).toHaveBeenCalled();
      expect(model.get('description')).toEqual('wadus');
      expect(view.el.classList).not.toContain('is-editing');
    });

    it('should cancel edition if esc is pressed', function() {
      view.render();

      expect(view.el.classList).not.toContain('is-editing');

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type something and hit escape
      type(view.$('.js-field-input'), "wadus");
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ESCAPE));

      expect(view.el.classList).not.toContain('is-editing');

      // Model has not been updated
      expect(model.save).not.toHaveBeenCalled();
    });

    it('should cancel edition on blur', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type something and leave the input
      type(view.$('.js-field-input'), "wadus");
      view.$('.js-field-input').trigger(jQuery.Event("blur"));

      expect(view.el.classList).not.toContain('is-editing');
    });

    it('should introduce new lines if cmd+enter is pressed', function() {
      view.render();

      // Type something and hit cmd+enter to add a newline
      type(view.$('.js-field-input'), "wadus");
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER, true));

      expect(view.$('.js-field-input').val()).toEqual("wadus\n");

      // Model has not been updated
      expect(model.save).not.toHaveBeenCalled();
      expect(model.get('description')).toEqual('');
    });

    it('should not save when the user hits enter and the field is empty', function() {
      view.render();

      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(view.$('.js-field-input').val()).toEqual("");

      // Model has not been updated
      expect(model.save).not.toHaveBeenCalled();
    });
  });

  describe('if the field is NOT editable', function(){

    beforeEach(function() {
      view = new EditableDescription({
        model: model,
        editable: false
      });
    });

    it("should render a no-results message if field is empty", function() {
      view.render();

      expect(view.$('div span.NoResults').html()).toEqual('No description');
    });
  });
});

