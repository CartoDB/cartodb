var $ = require('jquery');
var Backbone = require('backbone');
var LayerAnalysisDraggableView = require('builder/editor/layers/layer-analysis-draggable-view');

describe('editor/layers/layer-analysis-draggable-view', function () {
  beforeEach(function () {
    this.$nodeViewElement = $('div');
    spyOn(this.$nodeViewElement, 'draggable').and.callThrough();

    this.model = new Backbone.Model({
      id: 'a1',
      type: 'buffer'
    });

    this.view = new LayerAnalysisDraggableView({
      layerDefinitionModel: new Backbone.Model(),
      model: this.model,
      getNextLetter: function () { return 'b'; },
      sortableSelector: '.js-layers',
      $nodeViewElement: this.$nodeViewElement
    });
    this.view.render();
  });

  afterEach(function () {
    this.$nodeViewElement = null;
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('should initialize draggable for given nodeView element', function () {
    beforeEach(function () {
      expect(this.$nodeViewElement.draggable).toHaveBeenCalled();
      expect(this.$nodeViewElement.data('ui-draggable')).toBeDefined();
      this.draggableArgs = this.$nodeViewElement.draggable.calls.argsFor(0)[0];
    });

    it('should connect draggable item to layers sortable list', function () {
      expect(this.draggableArgs.connectToSortable).toEqual('.js-layers');
      expect(this.draggableArgs.appendTo).toEqual('.js-layers');
    });

    describe('when dragged', function () {
      beforeEach(function () {
        // simulate dragging
        this.html = this.draggableArgs.helper();
      });

      it('should create a helper HTML, previewing a new layer', function () {
        expect(this.html).toEqual(jasmine.any(String));
        expect(this.html).toContain('Layer');
        expect(this.html).toContain('>b<', 'should have the next-letter representation');
        expect(this.html).toContain('"a1"', 'should have the node-id the new layer will be based on');
        expect(this.html).toContain('area-of-influence'); // title of a buffer type
      });
    });
  });

  describe('.clean', function () {
    beforeEach(function () {
      this.view.clean();
    });

    it('should remove draggable behavior from element', function () {
      expect(this.$nodeViewElement.data('ui-draggable')).toBeUndefined();
    });

    it('should remove reference to DOM element', function () {
      expect(this.view.options.$nodeViewElement).toBe(null);
    });
  });
});
