var Backbone = require('backbone');
var Toggler = require('../../../../../../javascripts/cartodb3/components/toggler/toggler-view.js');
var EditorModel = require('../../../../../../javascripts/cartodb3/data/editor-model');

describe('components/toggler/toggler', function () {
  var panes = [{
    selected: true
  }, {
    selected: false
  }];

  var collection = new Backbone.Collection(panes);

  beforeEach(function () {
    spyOn(Toggler.prototype, 'render').and.callThrough();
    this.editorModel = new EditorModel();

    this.view = new Toggler({
      editorModel: this.editorModel,
      collection: collection,
      labels: ['OFF', 'ON']
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-input').prop('checked')).toBe(false);
    expect(this.view.$('label').length).toBe(2);
  });

  it('should re render on change collection', function () {
    collection.at(1).set({selected: true});
    expect(Toggler.prototype.render).toHaveBeenCalled();
  });

  it('should re render on change disabled', function () {
    this.editorModel.set({disabled: true});
    expect(Toggler.prototype.render).toHaveBeenCalled();
    expect(this.view.$('.js-input').prop('disabled')).toBe(false);
  });

  it('should be disabled if is disableable and editor is disabled', function () {
    expect(this.view.$('.js-input').prop('disabled')).toBe(false);
    this.view._isDisableable = true;
    this.editorModel.set({disabled: true});
    expect(Toggler.prototype.render).toHaveBeenCalled();
    expect(this.view.$('.js-input').prop('disabled')).toBe(true);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
