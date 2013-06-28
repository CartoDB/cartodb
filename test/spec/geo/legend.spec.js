
describe("common.geo.ui.Legend", function() {

  var legend;

  beforeEach(function() {

    legend = new cdb.geo.ui.Legend({
      template: _.template("<ul></ul>"),
      model: new cdb.core.Model()
    });

    $("body").append(legend.render().$el);
  });

  it("should show", function() {
    legend.show();
    expect(legend.$el.css('display')).toEqual('block');
  });

  it("should hide", function() {
    legend.show();
    legend.hide();

    waits(300);

    runs(function () {
      expect(legend.$el.css('display')).toEqual('none');
    });
  });

});
