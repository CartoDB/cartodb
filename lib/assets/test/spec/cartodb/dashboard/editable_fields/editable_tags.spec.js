var EditableTags = require('../../../../../javascripts/cartodb/dashboard/editable_fields/editable_tags');
var Router = require('../../../../../javascripts/cartodb/dashboard/router');
var cdbAdmin = require('cdb.admin');

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

describe('dashboard/editable_fields/editable_tags', function() {

  var model, view, router;

  beforeEach(function() {
    model = new Backbone.Model({
      tags: ''
    });
    var user = new cdbAdmin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });
    router = new Router({
      dashboardUrl: user.viewUrl().dashboard()
    });
    view = new EditableTags({
      model: model,
      router: router,
      editable: true
    });
    spyOn(Backbone, 'sync');
    spyOn(model, 'save').and.callThrough();
  });

  it('should add the "EditableField" class to the element', function() {
    view.render();

    expect(view.el.classList).toContain('EditableField');
  });

  it('should display up to 3 tags', function() {
    model.set({
      tags: ['dolorem', 'ipsum', 'quia', 'dolor', 'sit']
    });

    view.render();

    var $tagItems = view.$('.CDB-Tag')
    expect($tagItems.length).toBe(3);
    expect($($tagItems[0]).attr('href')).toEqual('http://paco.carto.com/dashboard/datasets/tag/dolorem')
    expect($($tagItems[1]).attr('href')).toEqual('http://paco.carto.com/dashboard/datasets/tag/ipsum')
    expect($($tagItems[2]).attr('href')).toEqual('http://paco.carto.com/dashboard/datasets/tag/quia')
    expect(view.$el.html()).toContain('and 2 more');
    expect(view.$('.NoResults').length).toEqual(0);
  });

  it('should NOT display empty tags', function() {
    model.set({
      tags: ['dolorem', '']
    });

    view.render();

    var $tagItems = view.$('.CDB-Tag')
    expect($tagItems.length).toBe(1);
    expect($($tagItems[0]).attr('href')).toEqual('http://paco.carto.com/dashboard/datasets/tag/dolorem')
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

      // Type some tags separated by commas
      type(view.$('.js-field-input'), 'wadus1, wadus2, wadus3');

      // Hit enter to save the tag
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).toHaveBeenCalledWith({
        tags: ['wadus1', 'wadus2', 'wadus3']
      });

      expect(view.el.classList).not.toContain('is-editing');
      expect(view.$('.CDB-Tag').length).toBe(3);
    });

    it('should trim tags', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type some tags separated by commas
      type(view.$('.js-field-input'), '   wadus1,    wadus2, wadus3    ');

      // Hit enter to save the tag
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).toHaveBeenCalledWith({
        tags: ['wadus1', 'wadus2', 'wadus3']
      });
    });

    it('should strip HTML from tags', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type some tags separated by commas
      type(view.$('.js-field-input'), '<p>wadus</p>');

      // Hit enter to save the tag
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).toHaveBeenCalledWith({
        tags: ['wadus']
      });
    });

    it('should remove duplicated tags', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type some tags separated by commas
      type(view.$('.js-field-input'), 'wadus, wadus');

      // Hit enter to save the tag
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).toHaveBeenCalledWith({
        tags: ['wadus']
      });
    });

    it('should prevent empty tags from being created', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      // Type something with loads of commas
      type(view.$('.js-field-input'), ',,wadus,');

      // Hit enter to save the tag
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).toHaveBeenCalledWith({
        tags: ['wadus']
      });
    })

    it('should not save the tags if no tags have been added', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      // Hit enter to save the tag
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ENTER));

      expect(model.save).not.toHaveBeenCalledWith();
    });

    it('should cancel tag edition if user hits escape', function() {
      view.render();

      // Click on the link to toggle the textarea
      view.$('.js-add-btn').trigger('click');

      expect(view.el.classList).toContain('is-editing');

      // Type some tags separated by commas
      type(view.$('.js-field-input'), 'wadus1, wadus2, wadus3');

      // Hit escape to cancel editing
      view.$('.js-field-input').trigger(keyPressEvent($.ui.keyCode.ESCAPE));

      expect(model.save).not.toHaveBeenCalled();
      expect(view.$('.DefaultTags-item').length).toBe(0);
    });

    it('should cancel tag edition on blur', function() {
      view.render();

      // Type some tags separated by commas
      type(view.$('.js-field-input'), 'wadus1, wadus2, wadus3');

      // Leave the input
      view.$('.js-field-input').trigger(jQuery.Event("blur"));

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
