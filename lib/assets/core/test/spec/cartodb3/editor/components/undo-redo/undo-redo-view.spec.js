var Backbone = require('backbone');
var _ = require('underscore');
var UndoRedo = require('../../../../../../javascripts/cartodb3/components/undo-redo/undo-redo-view.js');
var EditorModel = require('../../../../../../javascripts/cartodb3/data/editor-model.js');
var StyleModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model.js');

describe('components/undo-redo/undo-redo-view', function () {
  beforeEach(function () {
    this.editorModel = new EditorModel({
      edition: false
    });

    this.view = new UndoRedo({
      editorModel: new EditorModel({
        edition: false
      }),
      trackModel: new StyleModel()
    });

    spyOn(this.view, '_onRedoClick');
    spyOn(this.view, '_onUndoClick');
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('button').length).toBe(2);
    expect(_.size(this.view._subviews)).toBe(2); // [undoTooltip, redoTooltip]
  });

  it('should render apply button properly', function () {
    this.view._editorModel.set({ edition: true });
    this.view.options.applyButton = true;
    this.view.render();
    expect(this.view.$('button').length).toBe(3);
  });

  it('should render clear button properly', function () {
    var view = new UndoRedo({
      applyButton: true,
      clearButton: true,
      clearModel: new Backbone.Model({
        visible: true
      }),
      editorModel: new EditorModel({
        edition: false
      }),
      trackModel: new StyleModel()
    });

    view._editorModel.set({ edition: true });
    view.render();
    expect(view.$('button').length).toBe(4);
  });

  it('should show the apply button as not loading by default', function () {
    expect(this.view.$el.find('.js-apply.is-loading').length).toBe(0);
    expect(this.view.$el.find('.js-apply.is-disabled').length).toBe(0);
  });

  it('should show the apply button as loading if applyStatusModel changes', function () {
    var view = new UndoRedo({
      applyButton: true,
      applyStatusModel: new Backbone.Model({
        loading: false
      }),
      editorModel: new EditorModel({
        edition: true
      }),
      trackModel: new StyleModel()
    });
    view.render();

    expect(view.$el.find('.js-apply.is-loading').length).toBe(0);
    expect(view.$el.find('.js-apply.is-disabled').length).toBe(0);

    view._applyStatusModel.set('loading', true);

    expect(view.$el.find('.js-apply.is-loading').length).toBe(1);
    expect(view.$el.find('.js-apply.is-disabled').length).toBe(1);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
