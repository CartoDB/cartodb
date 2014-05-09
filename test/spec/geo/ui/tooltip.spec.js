
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
    tooltip.options.wrapdata = true;
    tooltip.setColumnsOrder(['test2', 'test1', 'huracan']);
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
    tooltip.options.wrapdata = true;
    tooltip.setTemplate('{{#fields}}{{{ title }}},{{/fields}}');
    tooltip.options.alternative_names = {
      'test1': 'testnamed'
    };
    tooltip.enable();
    layer.trigger('mouseover', new Event('e'), [0,0], [0, 0], {
      test1: 'test1',
      test2: 'test2',
      huracan: 'huracan'
    });
    expect(tooltip.$el.html()).toEqual('testnamed,test2,huracan,');
  });

});
