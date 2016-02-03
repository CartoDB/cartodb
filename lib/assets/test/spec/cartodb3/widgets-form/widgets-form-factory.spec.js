var _ = require('underscore');
var WidgetsFormFactory = require('../../../../javascripts/cartodb3/widgets-form/widgets-form-factory');

describe('widgets-form/widgets-form-factory', function () {
  describe('formula form', function () {
    beforeEach(function () {
      this.attrs = ['column', 'layer_id', 'operation', 'prefix', 'suffix', 'sync', 'title', 'type'];

      var widgetDefinitionAttributes = {
        type: 'formula',
        layer_id: '123',
        options: {
          column: 'my_column'
        }
      };

      this.model = WidgetsFormFactory.createWidgetFormModel(widgetDefinitionAttributes);
    });

    it('should generate the schema model', function () {
      _.each(this.attrs, function (attr) {
        expect(this.model.schema[attr]).toBeDefined();
      }, this);
    });

    it('shouldn\'t include the options as an attribute', function () {
      expect(this.model.get('options')).not.toBeDefined();
    });
  });

  describe('category form', function () {
    beforeEach(function () {
      this.attrs = ['column', 'layer_id', 'prefix', 'suffix', 'aggregationColumn', 'sync', 'title', 'type'];

      var widgetDefinitionAttributes = {
        type: 'category',
        layer_id: '123',
        options: {
          column: 'my_column'
        }
      };

      this.model = WidgetsFormFactory.createWidgetFormModel(widgetDefinitionAttributes);
    });

    it('should generate the schema model', function () {
      _.each(this.attrs, function (attr) {
        expect(this.model.schema[attr]).toBeDefined();
      }, this);
    });

    it('shouldn\'t include the options as an attribute', function () {
      expect(this.model.get('options')).not.toBeDefined();
    });
  });

  describe('histogram', function () {
    beforeEach(function () {
      this.attrs = ['column', 'layer_id', 'bins', 'sync', 'title', 'type'];

      var widgetDefinitionAttributes = {
        type: 'histogram',
        layer_id: '123',
        options: {
          column: 'my_column'
        }
      };

      this.model = WidgetsFormFactory.createWidgetFormModel(widgetDefinitionAttributes);
    });

    it('should generate the schema model', function () {
      _.each(this.attrs, function (attr) {
        expect(this.model.schema[attr]).toBeDefined(attr);
      }, this);
    });

    it('shouldn\'t include the options as an attribute', function () {
      expect(this.model.get('options')).not.toBeDefined();
    });
  });

  describe('time-series', function () {
    beforeEach(function () {
      this.attrs = ['column', 'layer_id', 'bins', 'start', 'end', 'sync', 'title', 'type'];

      var widgetDefinitionAttributes = {
        type: 'time-series',
        layer_id: '123',
        options: {
          column: 'my_column'
        }
      };

      this.model = WidgetsFormFactory.createWidgetFormModel(widgetDefinitionAttributes);
    });

    it('should generate the schema model', function () {
      _.each(this.attrs, function (attr) {
        expect(this.model.schema[attr]).toBeDefined(attr);
      }, this);
    });

    it('shouldn\'t include the options as an attribute', function () {
      expect(this.model.get('options')).not.toBeDefined();
    });
  });
});
