
describe("Overlay", function() {

  it("should place the object", function() {
    var v = new cdb.core.View();
    var view = new cdb.vis.Overlay({
      widget: v,
      data: {
        pos: [10, 100] //x,y
      }
    });

    expect(view.$el.css('left')).toEqual('10px');
    expect(view.$el.css('top')).toEqual('100px');
    expect(v.$el.parent()[0]).toEqual(view.el);
  });

  it("should register and create a type", function() {
    var _data;
    cdb.vis.Overlay.register('test', function(data) {
      _data = data;
      return new cdb.core.View();
    });

    var opt = {a : 1, b:2, pos: [10, 20]};
    var v = cdb.vis.Overlay.create('test', opt);
    expect(_data).toEqual(opt);
    expect(v.$el.css('left')).toEqual('10px');
    expect(v.$el.css('top')).toEqual('20px');

  });

}); 
