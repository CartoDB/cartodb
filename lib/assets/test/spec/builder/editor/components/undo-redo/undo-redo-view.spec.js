var Backbone = require('backbone');
var _ = require('underscore');
var UndoRedo = require('builder/components/undo-redo/undo-redo-view');
var EditorModel = require('builder/data/editor-model');
var StyleModel = require('builder/editor/style/style-definition-model');

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

    this.view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(this.view.$('button').length).toBe(2);
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
  });

  describe('when .canUndo and .canRedo are true', function () {
    beforeEach(function () {
      spyOn(this.view, '_canUndo').and.returnValue(true);
      spyOn(this.view, '_canRedo').and.returnValue(true);

      this.view.render();
    });

    describe('.render', function () {
      it('should render properly', function () {
        expect(this.view.$('button').length).toBe(2);
        expect(_.size(this.view._subviews)).toBe(2); // [undoTooltip, redoTooltip]
      });
    });
  });

  describe('.initBinds', function () {
    it('should call ._checkButtonsStyle when _editorModel:edition changes', function () {
      spyOn(this.view, '_checkButtonsStyle');

      this.view._initBinds();
      this.view._editorModel.trigger('change:edition');

      expect(this.view._checkButtonsStyle).toHaveBeenCalled();
    });

    it('should call .render when _trackModel triggers unredoChanged', function () {
      spyOn(this.view, 'render');

      this.view._initBinds();
      this.view._trackModel.trigger('unredoChanged');

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should call .render when _trackModel triggers undo', function () {
      spyOn(this.view, 'render');

      this.view._initBinds();
      this.view._trackModel.trigger('undo');

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should call .render when _trackModel triggers redo', function () {
      spyOn(this.view, 'render');

      this.view._initBinds();
      this.view._trackModel.trigger('redo');

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should call .render when _clearModel changes', function () {
      this.view._clearModel = new Backbone.Model();
      spyOn(this.view, 'render');

      this.view._initBinds();
      this.view._clearModel.trigger('change');

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should call ._applyStatusChanged when _applyStatusModel:loading changes', function () {
      this.view._applyStatusModel = new Backbone.Model();
      spyOn(this.view, '_applyStatusChanged');

      this.view._initBinds();
      this.view._applyStatusModel.trigger('change:loading');

      expect(this.view._applyStatusChanged).toHaveBeenCalled();
    });
  });

  describe('._isDisabled', function () {
    it('should be true if overlay model is visible', function () {
      this.view._overlayModel = new Backbone.Model({ visible: false });
      expect(this.view._isDisabled()).toBe(false);

      this.view._overlayModel.set({ visible: true });
      expect(this.view._isDisabled()).toBe(true);
    });
  });

  describe('._canRedo', function () {
    it('should return true if _trackModel.canRedo and is not disabled', function () {
      spyOn(this.view._trackModel, 'canRedo').and.returnValue(true);
      spyOn(this.view, '_isDisabled').and.returnValue(false);

      expect(this.view._canRedo()).toBe(true);
    });
  });

  describe('._canUndo', function () {
    it('should return true if _trackModel.canRedo and is not disabled', function () {
      spyOn(this.view._trackModel, 'canUndo').and.returnValue(true);
      spyOn(this.view, '_isDisabled').and.returnValue(false);

      expect(this.view._canUndo()).toBe(true);
    });
  });

  describe('._onUndoClick', function () {
    it('should call _trackModel.undo if _trackModel.canUndo is true', function () {
      spyOn(this.view._trackModel, 'undo');
      var canUndoSpy = spyOn(this.view._trackModel, 'canUndo');

      canUndoSpy.and.returnValue(false);
      this.view._onUndoClick();
      expect(this.view._trackModel.undo).not.toHaveBeenCalled();

      canUndoSpy.and.returnValue(true);
      this.view._onUndoClick();
      expect(this.view._trackModel.undo).toHaveBeenCalled();
    });
  });

  describe('._onRedoClick', function () {
    it('should call _trackModel.undo if _trackModel.canRedo is true', function () {
      spyOn(this.view._trackModel, 'redo');
      var canRedoSpy = spyOn(this.view._trackModel, 'canRedo');

      canRedoSpy.and.returnValue(false);
      this.view._onRedoClick();
      expect(this.view._trackModel.redo).not.toHaveBeenCalled();

      canRedoSpy.and.returnValue(true);
      this.view._onRedoClick();
      expect(this.view._trackModel.redo).toHaveBeenCalled();
    });
  });

  describe('._onApplyClick', function () {
    it('should call options.onApplyClick method if applyButton is true and button is not disabled', function () {
      var view = new UndoRedo({
        editorModel: new EditorModel({
          edition: false
        }),
        trackModel: new StyleModel(),
        onApplyClick: jasmine.createSpy('onApplyClick'),
        applyButton: true
      });

      var isDisabled = spyOn(view, '_isDisabled');

      isDisabled.and.returnValue(true);
      view._onApplyClick();
      expect(view.options.onApplyClick).not.toHaveBeenCalled();

      isDisabled.and.returnValue(false);
      view._onApplyClick();
      expect(view.options.onApplyClick).toHaveBeenCalled();
    });
  });

  describe('._onClearClick', function () {
    it('should call options._onClearClick method if clearButton is true', function () {
      var view = new UndoRedo({
        editorModel: new EditorModel({
          edition: false
        }),
        trackModel: new StyleModel(),
        onClearClick: jasmine.createSpy('onClearClick'),
        clearButton: true
      });

      view._onClearClick();
      expect(view.options.onClearClick).toHaveBeenCalled();
    });
  });

  describe('._applyStatusChanged', function () {
    it('should call render', function () {
      spyOn(this.view, 'render');

      this.view._applyStatusChanged();

      expect(this.view.render).toHaveBeenCalled();
    });
  });

  describe('._checkButtonsStyle', function () {
    it('should apply u-actionTextColor class if not editing', function () {
      expect(this.view._getIcons().hasClass('u-actionTextColor')).toBe(true);
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
