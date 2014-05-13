
describe('cdb.geo.Tooltip', function() {

  var tooltip, layer;
  beforeEach(function() {
    layer = new Backbone.Model();
    tooltip = new cdb.geo.ui.Tooltip({
      template: '{{#fields}}{{{ value }}},{{/fields}}',
      layer: layer
    });
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
    layer.trigger('mouseover', new Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'huracan'
    });
    expect(tooltip.$el.html()).toEqual('test2,test1,huracan,');
    tooltip.options.columns_order = null;
    layer.trigger('mouseover', new Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'hurecan'
    });
    expect(tooltip.$el.html()).not.toEqual('test2,test1,huracan,');

  });

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
    layer.trigger('mouseover', new Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'huracan'
    });
    expect(tooltip.$el.html()).toEqual('test2,testnamed,huracan,');
  });

});
