
describe("Overlay", function() {


  it("should register and create a type", function() {
    var _data;
    cdb.vis.Overlay.register('test', function(data) {
      _data = data;
      return new cdb.core.View();
    });

    var opt = {a : 1, b:2, pos: [10, 20]};
    var v = cdb.vis.Overlay.create('test', null, opt);
    expect(_data).toEqual(opt);

  });

}); 
