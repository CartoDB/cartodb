var UndoRedo = require('../../../../../../javascripts/cartodb3/editor/components/undo-redo/undo-redo-view.js');
var EditorModel = require('../../../../../../javascripts/cartodb3/data/editor-model.js');
var StyleModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model.js');

describe('editor/components/undo-redo/undo-redo-view', function () {
  beforeEach(function () {
    this.editorModel = new EditorModel({
      edition: false
    });

    this.view = new UndoRedo({
      editorModel: new EditorModel({
        edition: false
      }),
      styleModel: new StyleModel()
    });

    spyOn(this.view, '_onRedoClick');
    spyOn(this.view, '_onUndoClick');
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('button').length).toBe(2);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render apply button properly', function () {
    this.view._editorModel.set({edition: true});
    this.view.render();
    expect(this.view.$('button').length).toBe(3);
  });

  afterEach(function () {
    this.view.clean();
  });
});
