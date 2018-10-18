var Backbone = require('backbone');
var _ = require('underscore');
var UndoManager = require('builder/data/undo-manager');

describe('data/undo-manager', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      test: 1
    });
    UndoManager.init(this.model, { track: true });
  });

  it('should set undoManager', function () {
    expect(this.model._undoManager).toBeDefined();
  });

  it('should accept history via params', function () {
    var model = new Backbone.Model({
      test: 1
    });
    var history = [{ test: 2 }, { test: 3 }, { test: 1 }];
    UndoManager.init(model, { track: true, history: history });

    expect(model._undoManager.stack.size()).toBe(2);
    expect(model._undoManager.stack.pointer).toBe(1);
    expect(model.canUndo()).toBeTruthy();
  });

  describe('trackEvents', function () {
    beforeEach(function () {
      this.model.set('test', 2);
    });

    it('should trigger undo when they happen', function () {
      var onUndo = jasmine.createSpy('undo');
      this.model.bind('undo', onUndo);
      this.model.undo();
      expect(onUndo).toHaveBeenCalled();
    });

    it('should trigger redo when they happen', function () {
      var onRedo = jasmine.createSpy('redo');
      this.model.undo();
      this.model.bind('redo', onRedo);
      this.model.redo();
      expect(onRedo).toHaveBeenCalled();
    });

    it('should trigger undoredoChanged when any change has added to the stack', function () {
      var onUnReDo = jasmine.createSpy('unredo');
      this.model.bind('unredoChanged', onUnReDo);
      this.model.set('test', 3);
      expect(onUnReDo).toHaveBeenCalled();
      this.model.set('test', 0);
      expect(onUnReDo.calls.count()).toBe(2);
      this.model.set('test', 5);
      expect(onUnReDo.calls.count()).toBe(3);
    });
  });

  describe('public methods', function () {
    it('should add several public methods to the model', function () {
      _.each(['undo', 'redo', 'canUndo', 'canRedo', 'getUndoHistory'], function (method) {
        expect(this.model[method]).toBeDefined();
      }, this);
    });

    it('should undo backbone-undo', function () {
      spyOn(this.model._undoManager, 'undo');
      this.model.undo();
      expect(this.model._undoManager.undo).toHaveBeenCalled();
    });

    it('should redo backbone-undo', function () {
      spyOn(this.model._undoManager, 'redo');
      this.model.redo();
      expect(this.model._undoManager.redo).toHaveBeenCalled();
    });

    it('should check if there is any undo or redo action', function () {
      spyOn(this.model._undoManager, 'isAvailable');
      this.model.canUndo();
      expect(this.model._undoManager.isAvailable).toHaveBeenCalledWith('undo');
      this.model._undoManager.isAvailable.calls.reset();
      this.model.canRedo();
      expect(this.model._undoManager.isAvailable).toHaveBeenCalledWith('redo');
    });

    it('should return stack history', function () {
      this.model.set('test', 2);
      this.model.set('test', 3);
      var history = this.model.getUndoHistory();
      expect(history.length).toBe(3);
      expect(history[0]).toEqual({ test: 1 });
      expect(history[1]).toEqual({ test: 2 });
      expect(history[2]).toEqual({ test: 3 });
    });
  });
});
