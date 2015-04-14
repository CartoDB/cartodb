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
  $textarea.val(word);

  // Trigger keydown events for each letter
  var letters = word.split('');
  for (var i = 0; i < letters.length; i++) {
    var keyCode = letters[i].charCodeAt(0)
    $textarea.trigger(keyPressEvent(keyCode));
  }
}

var model, view;

describe('new_common/editable_field', function() {

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
  });

  it('should add the "EditableField" class to the element', function() {
    view.render();

    expect(view.el.classList).toContain('EditableField');
  });

  it('should render the field when it has some value', function() {
    // Description might contain markdown
    model.set({description: '**wadus**'});

    view.render();

    expect(view.$('div').attr('title')).toEqual('wadus');
    expect(view.$('div p strong').html()).toEqual('wadus');
  });

  describe('if the field is editable', function(){

    beforeEach(function() {
      view = new EditableField({
        model: model,
        fieldName: 'description',
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

      expect(view.$('div').attr('title')).toEqual('wadus');
      expect(view.$('div p').html()).toEqual('wadus');

      // Model has been saved
      expect(model.save).toHaveBeenCalled();
      expect(model.get('description')).toEqual('wadus');
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

      expect(view.$('.js-field-input').val()).toEqual('');
      expect(view.el.classList).not.toContain('is-editing');

      // Model has not been updated
      expect(model.save).not.toHaveBeenCalled();
      expect(model.get('description')).toEqual('');
    });

    it('should cancel edition on blur', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type something and leave the input
      type(view.$('.js-field-input'), "wadus");
      view.$('.js-field-input').trigger(jQuery.Event("blur"));

      expect(view.$('.js-field-input').val()).toEqual('');
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

    it('should limit the number of characters', function() {
      pending();
    });
  });

  describe('if the field is NOT editable', function(){

    beforeEach(function() {
      view = new EditableField({
        model: model,
        fieldName: 'description',
        editable: false
      });
    });

    it("should render a no-results message if field is empty", function() {
      view.render();

      expect(view.$('div span.NoResults').html()).toEqual('No description');
    });
  });
});

