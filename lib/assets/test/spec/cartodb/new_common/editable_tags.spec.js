var EditableTags = require('../../../../javascripts/cartodb/new_common/editable_tags');

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

describe('new_common/editable_tags', function() {

  var model, view, router;

  beforeEach(function() {
    model = new Backbone.Model({
      tags: ''
    });
    router = {
      currentUrl: function(){}
    };
    view = new EditableTags({
      model: model,
      router: router,
      editable: true
    });
    spyOn(Backbone, 'sync');
    spyOn(model, 'save').and.callThrough();
  });

  it('should add the "EditableTags" class to the element', function() {
    view.render();

    expect(view.el.classList).toContain('EditableTags');
  });

  it('should display up to 3 tags', function() {
    model.set({
      tags: ['dolorem', 'ipsum', 'quia', 'dolor', 'sit']
    });

    view.render();

    //TODO: Test that links are generated correctly
    expect(view.$('.DefaultTags-item').length).toBe(3);
    expect(view.$el.html()).toContain('and 2 more');
    expect(view.$('.NoResults').length).toEqual(0);
  });

  describe('if tags are editable', function() {

    it('should render a button and save tags when no tags are present', function() {
      view.render();

      expect(view.el.classList).not.toContain('is-editing');
      expect(view.$('input[type=hidden][name=tags]').length).toEqual(0);

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      var newTagInput = view.$('.tags').data('tagit').tagInput;

      // Enter a tag and hit enter
      type(newTagInput, 'wadus1');
      newTagInput.trigger(keyPressEvent($.ui.keyCode.ENTER));
      expect(model.save).not.toHaveBeenCalled();

      // Hit enter to save the tag
      newTagInput.trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).toHaveBeenCalledWith({
        tags: ['wadus1']
      });

      expect(view.$('.DefaultTags-item').length).toBe(1);
    });

    it('should not save the tags if no tags have been added', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      var newTagInput = view.$('.tags').data('tagit').tagInput;

      // Hit enter
      newTagInput.trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).not.toHaveBeenCalledWith();
    });

    it('should cancel tag edition if user hits escape', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      var newTagInput = view.$('.tags').data('tagit').tagInput;

      // Enter a tag and hit enter
      type(newTagInput, 'wadus1');
      newTagInput.trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).not.toHaveBeenCalled();
      expect(view.$('input[type=hidden][name=tags]').length).toEqual(1);

      // Hit escape to cancel edition
      newTagInput.trigger(keyPressEvent($.ui.keyCode.ESCAPE));

      expect(model.save).not.toHaveBeenCalled();
      expect(view.$('input[type=hidden][name=tags]').length).toEqual(0);
      expect(view.$('.DefaultTags-item').length).toBe(0);
    });

    it('should cancel tag edition on blur', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      var newTagInput = view.$('.tags').data('tagit').tagInput;

      // Leave the input
      newTagInput.trigger(jQuery.Event("blur"));

      expect(view.el.classList).not.toContain('is-editing');
      expect(model.save).not.toHaveBeenCalled();
    });
  });

  describe('if tags are NOT editable', function() {

    beforeEach(function() {
      view = new EditableTags({
        model: model,
        router: router,
        editable: false
      });
    });

    it('should display a no tags message', function() {
      view.render();

      expect(view.$('.DefaultTags span.NoResults').html()).toEqual('No tags');
    });
  });
});