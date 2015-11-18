var Overlay = require('cdb/vis/vis/overlay');
var View = require('cdb/core/view');

describe('vis/vis/overlay', function() {

  it("should register and create a type", function() {
    var _data;
    Overlay.register('test', function(data) {
      _data = data;
      return new View();
    });

    var opt = {a : 1, b:2, pos: [10, 20]};
    var v = Overlay.create('test', null, opt);
    expect(_data).toEqual(opt);
  });
});