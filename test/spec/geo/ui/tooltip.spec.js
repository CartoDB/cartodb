var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var TooltipView = require('../../../../src/geo/ui/tooltip-view');

describe('geo/ui/tooltip-view', function() {

  var tooltip, layer, container, mapView;
  beforeEach(function() {
    container = $("<div id='map'>").css('height', '1000px');
    $('body').append(container)
    var map = new Map();
    mapView = new LeafletMapView({
      el: $('#map'),
      map: map,
      layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
      layerGroupModel: new Backbone.Model()
    });

    layer = new Backbone.Model();
    tooltip = new TooltipView({
      template: '{{#fields}}{{{ value }}},{{/fields}}',
      layer: layer,
      mapView: mapView
    });
  });

  afterEach(function() {
    $('#map').remove();
  });

  it ("should render fields in specified order", function() {
    tooltip.setFields([{
      name:'test2'
    }, {
      name:'test1'
    }, {
      name: 'huracan'
    }]);
    tooltip.enable();
    layer.trigger('mouseover', new $.Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'huracan'
    });
    expect(tooltip.$el.html()).toEqual('test2,test1,huracan,');
    tooltip.options.columns_order = null;
    layer.trigger('mouseover', new $.Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'hurecan'
    });
    expect(tooltip.$el.html()).not.toEqual('test2,test1,huracan,');
  });

  it("should not show the tooltip if there are no fields", function() {
    tooltip.setFields([]);
    tooltip.enable();

    layer.trigger('mouseover', new $.Event('e'), [0, 0], [0, 0], {});

    // Tooltip is hidden
    expect(tooltip.showing).toBeFalsy();
  });

  it("should hide the tooltip if it was visible and there are no fields now", function() {
    tooltip.setFields([{
      name:'test2'
    }]);
    tooltip.enable();

    // mouseover a layer whose tooltip has fields
    layer.trigger('mouseover', new $.Event('e'), [0, 0], [0, 0], { name: 'wadus' });

    // Tooltip is visible
    expect(tooltip.showing).toBeTruthy();

    tooltip.setFields([]);

    // mouseover a layer whose tooltip doesn NOT has fields
    layer.trigger('mouseover', new $.Event('e'), [0, 0], [0, 0], {});

    // Tooltip is hidden
    expect(tooltip.showing).toBeFalsy();
  })

  it ("should use alternate_names ", function() {
    tooltip.setTemplate('{{#fields}}{{{ title }}},{{/fields}}');
    tooltip.setFields([{
      name:'test2',
      title: true
    }, {
      name:'test1',
      title: true
    }, {
      name: 'huracan',
      title: true
    }]);
    tooltip.options.alternative_names = {
      'test1': 'testnamed'
    };
    tooltip.enable();
    layer.trigger('mouseover', new $.Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'huracan'
    });
    expect(tooltip.$el.html()).toEqual('test2,testnamed,huracan,');
  });

  it ("should position the element correctly", function() {
    tooltip.$el.css('width', '200px');
    tooltip.$el.css('height', '20px');
    var data = { cartodb_id: 2, description: 'test' };

    tooltip.options.position = 'bottom|right';
    tooltip.show({ x:10, y:10 }, data);
    expect(tooltip.$el.css('top')).toBe('10px');
    expect(tooltip.$el.css('left')).toBe('10px');

    tooltip.options.position = 'top|left';
    tooltip.show({ x:210, y:40 }, data);
    expect(tooltip.$el.css('top')).toBe('20px');
    expect(tooltip.$el.css('left')).toBe('10px');

    tooltip.options.position = 'middle|center';
    tooltip.show({ x:150, y:30 }, data);
    expect(tooltip.$el.css('top')).toBe('20px');
    expect(tooltip.$el.css('left')).toBe('50px');

    // With offsets
    tooltip.options.position = 'middle|center';
    tooltip.options.vertical_offset = -10;
    tooltip.options.horizontal_offset = -10;
    tooltip.show({ x:150, y:30 }, data);
    expect(tooltip.$el.css('top')).toBe('10px');
    expect(tooltip.$el.css('left')).toBe('40px');
  });

  describe('overflow positioning', function() {
    var data;

    beforeEach(function() {
      data = { cartodb_id: 2, description: 'test' };
      $('#map').css('height', '100px');
      $('#map').css('width', '100px');
      tooltip.$el.css('height', '80px');
      tooltip.$el.css('width', '80px');
      mapView.invalidateSize();
    });

    it('should position the element on top when bottom overflow occurs', function() {
      tooltip.options.position = 'bottom|right';

      tooltip.show({ x:0, y:90 }, data);
      expect(tooltip.$el.css('top')).toBe('10px');
    });

    it('should position the element on the bottom when top overflow occurs', function() {
      tooltip.options.position = 'top|right';

      tooltip.show({ x:0, y:10 }, data);
      expect(tooltip.$el.css('top')).toBe('10px');
    });

    it('should position the element on top/bottom when overflow vertically centered and overflow occurs', function() {
      tooltip.options.position = 'middle|right';

      tooltip.show({ x:0, y:90 }, data);
      expect(tooltip.$el.css('top')).toBe('10px');

      tooltip.options.position = 'middle|right';

      tooltip.show({ x:0, y:10 }, data);
      expect(tooltip.$el.css('top')).toBe('10px');
    })

    it('should position the element on the left when right overflow occurs', function() {
      tooltip.options.position = 'top|right';

      tooltip.show({ x:90, y:10 }, data);
      expect(tooltip.$el.css('left')).toBe('10px');
    });

    it('should position the element on the right when left overflow occurs', function() {
      tooltip.options.position = 'top|left';

      tooltip.show({ x:10, y:10 }, data);
      expect(tooltip.$el.css('left')).toBe('10px');
    });

    it('should position the element on the left/right when horizontally centered and overflow occurs', function() {
      tooltip.options.position = 'top|center';

      tooltip.show({ x:10, y:10 }, data);
      expect(tooltip.$el.css('left')).toBe('10px');

      tooltip.options.position = 'top|center';

      tooltip.show({ x:90, y:10 }, data);
      expect(tooltip.$el.css('left')).toBe('10px');
    });

  });
});
