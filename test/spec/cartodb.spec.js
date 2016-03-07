/* global torque */
var cdb = require('../../src/cartodb');

describe('cartodb.js bundle', function() {
  it('should set cartodb object in global namespace', function() {
    expect(cdb).toEqual(jasmine.any(Object));
  });

  it('should have leaflet set', function() {
    expect(cdb.L).toEqual(jasmine.any(Object));
  });

  it('should have jQuery in addition to the defaults', function() {
    expect(cartodb.$).toBeDefined();
    expect(window.$).toBeUndefined(); // …but not in global scope though
  });

  describe('shared for cdb object in all bundles', function() {
    it('should set cartodb object in global namespace', function() {
      expect(window.cdb).toEqual(jasmine.any(Object));
      expect(window.cdb).toBe(cdb);
      expect(cdb).toBe(window.cartodb);
      expect(window.cartodb).toBe(cartodb);
    });

    it('should have common object placeholders', function() {
      expect(cdb.core).toEqual(jasmine.any(Object));
      expect(cdb.vis).toEqual(jasmine.any(Object));

      expect(cdb.geo).toEqual(jasmine.any(Object));
      expect(cdb.geo.ui).toEqual(jasmine.any(Object));
      expect(cdb.geo.geocoder).toEqual(jasmine.any(Object));

      expect(cdb.ui).toEqual(jasmine.any(Object));
      expect(cdb.ui.common).toEqual(jasmine.any(Object));
    });

    it('should have expected objects on cdb object', function() {
      expect(cdb.core).toEqual(jasmine.any(Object));
      expect(cdb.vis).toEqual(jasmine.any(Object));

      expect(cdb.vis.Loader).toEqual(jasmine.any(Object));
      expect(cdb.core.Loader).toBe(cdb.vis.Loader);

      expect(cdb.core.Profiler).toEqual(jasmine.any(Function));
      expect(cdb.core.util).toEqual(jasmine.any(Object));

      expect(cdb.SQL).toEqual(jasmine.any(Function));
      expect(cdb.Promise).toEqual(jasmine.any(Function));

      expect(cdb.VERSION).toEqual(jasmine.any(String));
      expect(cdb.DEBUG).toEqual(jasmine.any(Boolean));
      expect(cdb.CARTOCSS_VERSIONS).toEqual(jasmine.any(Object));
      expect(cdb.CARTOCSS_DEFAULT_VERSION).toEqual(jasmine.any(String));
    });
  });

  describe('shared for cdb object in all bundles except for core', function() {
    it('should have the commonly used vendor libs defined', function() {
      expect(cdb.$).toEqual(jasmine.any(Function));
      expect(cdb.Mustache).toEqual(jasmine.any(Object));
      expect(cdb.Backbone).toEqual(jasmine.any(Object));
      expect(cdb._).toEqual(jasmine.any(Function));
    });

    it('should have some common objects', function() {
      expect(cdb.config).toEqual(jasmine.any(Object));
      expect(cdb.log).toEqual(jasmine.any(Object));
      expect(cdb.errors).toEqual(jasmine.any(Object));
      expect(cdb.templates).toEqual(jasmine.any(Object));
      expect(cdb.decorators).toEqual(jasmine.any(Object));
      expect(cdb.createVis).toEqual(jasmine.any(Function));
      expect(cdb.createLayer).toEqual(jasmine.any(Function));
    });

    it('config should contain links variables', function() {
      expect(cdb.config.get('cartodb_attributions')).toEqual("CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>");
      expect(cdb.config.get('cartodb_logo_link')).toEqual("http://www.cartodb.com");
    });

    it('should generate error when error is called', function() {
      expect(cdb.config).toBeDefined();
      cdb.config.ERROR_TRACK_ENABLED = true
      cdb.errors.reset([]);
      cdb.log.error('this is an error');
      expect(cdb.errors.size()).toEqual(1);
    });

    it('should create a cdb.core with expected model', function() {
      expect(cdb.core.Template).toBeDefined();
      expect(cdb.core.TemplateList).toBeDefined();
      expect(cdb.core.Model).toBeDefined();
      expect(cdb.core.View).toBeDefined();
      expect(cdb.core.Loader).toEqual(jasmine.any(Object));
    });

    it("should create a cdb.decorators", function() {
      expect(cdb.decorators).toBeDefined();
    });

    it("should create a log", function() {
      expect(cdb.log).toBeDefined();
    });

    it('should add templates stuff', function() {
      expect(cdb.templates instanceof cdb.core.TemplateList).toBe(true);
    });

    it('should have a cdb.ui.common object', function() {
      expect(cdb.ui.common.Dialog).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.Dropdown).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.FullScreen).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.Notification).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.Row).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.TableData).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.TableProperties).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.RowView).toEqual(jasmine.any(Function));
      expect(cdb.ui.common.Table).toEqual(jasmine.any(Function));
    });

    it('should have a cdb.geo object', function() {
      expect(cdb.geo).toEqual(jasmine.any(Object));
      expect(cdb.geo.geocoder).toEqual(jasmine.any(Object));
      expect(cdb.geo.geocoder.YAHOO).toEqual(jasmine.any(Object));
      expect(cdb.geo.geocoder.NOKIA).toEqual(jasmine.any(Object));

      expect(cdb.geo.Geometry).toEqual(jasmine.any(Function));

      expect(cdb.geo.TileLayer).toEqual(jasmine.any(Function));
      expect(cdb.geo.GMapsBaseLayer).toEqual(jasmine.any(Function));
      expect(cdb.geo.WMSLayer).toEqual(jasmine.any(Function));
      expect(cdb.geo.PlainLayer).toEqual(jasmine.any(Function));
      expect(cdb.geo.TorqueLayer).toEqual(jasmine.any(Function));
      expect(cdb.geo.CartoDBLayer).toEqual(jasmine.any(Function));
      expect(cdb.geo.Layers).toEqual(jasmine.any(Function));
      expect(cdb.geo.Map).toEqual(jasmine.any(Function));
      expect(cdb.geo.MapView).toEqual(jasmine.any(Function));
    });

    it('should have a cdb.geo.ui object', function() {
      expect(cdb.geo.ui.Text).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Annotation).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Image).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Zoom).toEqual(jasmine.any(Function));

      expect(cdb.geo.ui.InfowindowModel).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Infowindow).toEqual(jasmine.any(Function));

      expect(cdb.geo.ui.Header).toEqual(jasmine.any(Function));

      expect(cdb.geo.ui.Search).toEqual(jasmine.any(Function));

      expect(cdb.geo.ui.LayerSelector).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.LayerView).toEqual(jasmine.any(Function));

      expect(cdb.geo.ui.TilesLoader).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.InfoBox).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Tooltip).toEqual(jasmine.any(Function));
    });

    it('should have a cdb.geo.ui object w/ legend models', function() {
      expect(cdb.geo.ui.Legend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Bubble).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Category).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Choropleth).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Color).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Custom).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Density).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Intensity).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.None).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legend.Stacked).toEqual(jasmine.any(Function));

      expect(cdb.geo.ui.LegendItemModel).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.LegendItem).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.LegendItems).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.LegendModel).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.Legends).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.BaseLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.BubbleLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.CategoryLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.ChoroplethLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.ColorLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.CustomLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.DebugLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.DensityLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.IntensityLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.NoneLegend).toEqual(jasmine.any(Function));
      expect(cdb.geo.ui.StackedLegend).toEqual(jasmine.any(Function));
    });

    it('should have a cdb.common object', function() {
      expect(cdb.geo.common).toEqual(jasmine.any(Object));
    });

    it('should have a core.vis', function() {
      expect(cdb.vis).toEqual(jasmine.any(Object));
      expect(cdb.vis.Loader).toBe(cdb.core.Loader);

      expect(cdb.vis.Overlay).toEqual(jasmine.any(Object));
      expect(cdb.vis.Overlays).toEqual(jasmine.any(Function));
      expect(cdb.vis.Layers).toEqual(jasmine.any(Object));
      expect(cdb.vis.Vis).toEqual(jasmine.any(Function));
      expect(cdb.vis.INFOWINDOW_TEMPLATE).toEqual(jasmine.any(Object));
    });

    it('should have a moduleLoad function', function() {
      // Extracted from vis/vis.js, not used for vis but for external libs to register to non-core libs
      expect(cdb.moduleLoad).toEqual(jasmine.any(Function));
    });
  });
});
