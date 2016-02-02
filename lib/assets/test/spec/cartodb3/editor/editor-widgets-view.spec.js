var _ = require('underscore');
var Backbone = require('backbone');
var EditorWidgetsView = require('../../../../javascripts/cartodb3/editor/editor-widgets-view');
var MapDefinitionModel = require('../../../../javascripts/cartodb3/data-models/map-definition-model');
var WidgetDefinitionModel = require('../../../../javascripts/cartodb3/data-models/widget-definition-model');
var cdb = require('cartodb-deep-insights.js');

describe('editor/editor-widgets-view', function () {
  beforeEach(function () {

    this.model = new MapDefinitionModel({
      id: '123',
      urlRoot: 'url'
    });

    this.view = new EditorWidgetsView({
      collection: this.model.widgets
    });

    this.view.render();
  });

  describe('when adding a widget', function() {
    beforeEach(function () {

      var widget = new WidgetDefinitionModel({
        type: 'formula',
        title: 'AVG districts homes',
        options: {
          column: 'areas',
          operation: 'avg'
        }
      }, {
        layerDefinitionModel: new cdb.core.Model()
      });

      this.model.widgets.add(widget);
    });

    it('should have no leaks', function () {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });

    it('should add a widget definition', function () {
      expect(this.view.$el.text()).toContain('AVG districts home');
    });

    afterEach(function () {
      this.view.clean();
    });
  });
});
