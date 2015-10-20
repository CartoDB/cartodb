describe('infobox', function() {
  var view;
  var layer;
  beforeEach(function() {
    layer = new Backbone.Model();
    view = new cdb.geo.ui.InfoBox({
      template: '#{{test}}#',
      position: 'top|right',
      pos_margin: 30,
      layer: layer
    });
  });

  it("should render with template", function() {
    view.render({ test: 'jaja' });
    expect(view.$el.html()).toEqual('#jaja#');
  });

  it("should render in position", function() {
    view.render({ test: 'jaja' });
    expect(view.$el.css('top')).toEqual('30px');
    expect(view.$el.css('right')).toEqual('30px');
  });

  it("should render on layer hover", function() {
    layer.trigger('featureOver', null, null, null, {
      test: '1234'
    });
    expect(view.$el.html()).toEqual('#1234#');
  });

  it("should disable/enable", function() {
    view.disable();
    layer.trigger('featureOver', null, null, null, {
      test: '1234'
    });
    expect(view.$el.html()).toEqual('');
    view.enable();
    layer.trigger('featureOver', null, null, null, {
      test: '1234'
    });
    expect(view.$el.html()).toEqual('#1234#');
  });

});
