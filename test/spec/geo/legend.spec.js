describe("common.geo.ui.Legend", function() {

  var data, legend;

  afterEach(function() {
    legend.clean();
  });

  beforeEach(function() {

    var map = new cdb.geo.Map();

    data = [
      { name: "Category 1", value: "#f1f1f1" },
      { name: "Category 2", value: "red" },
      { name: "Category 3", value: "#f1f1f1" },
      { name: "Category 4", value: "#ccc" },
    ];

    legend = new cdb.geo.ui.Legend({
      template: _.template("<ul></ul>"),
      data: data,
      map: map
    });

    $("body").append(legend.render().$el);

  });

  it("should have a 'custom' type set by default", function() {
    expect(legend.model.get("type")).toEqual('custom');
  });

  it("should allow to change type", function() {
    legend.model.set({ type: "bubble" });
    expect(legend.model.get("type")).toEqual('bubble');
  });

  it("should have a collection", function() {
    expect(legend.items instanceof cdb.geo.ui.LegendItems).toEqual(true);
  });

  it("should populate the collection", function() {
    expect(legend.items.length).toEqual(4);

    for (var i = 0; i < data.length; i++) {
      expect(legend.items.at(i).get("name")).toEqual(data[i].name);
    }

  });

  it("should set the type of the legend in the element", function() {
    legend.model.set({ type: "bubble" });
    legend.render();
    expect(legend.$el.hasClass("bubble")).toEqual(true);
  });

  it("should create the specific legend based on the type", function() {
    expect(legend.view instanceof cdb.geo.ui.CustomLegend).toEqual(true);
    expect(legend.$el.hasClass("custom")).toEqual(true);

    legend.model.set({ type: "bubble" });
    expect(legend.view instanceof cdb.geo.ui.BubbleLegend).toEqual(true);
    expect(legend.$el.hasClass("bubble")).toEqual(true);
    expect(legend.$el.hasClass("custom")).toEqual(false);
  });

  it("shouldn't create the legend if the type is unknown", function() {
    legend.model.set({ type: "the_legend_of_santana" });
    expect(legend.view instanceof cdb.geo.ui.CustomLegend).toEqual(true);
    expect(legend.$el.hasClass("custom")).toEqual(true);
  });

  it("should show the legend", function() {
    legend.show();
    expect(legend.$el.css('display')).toEqual('block');
  });

  it("should hide the legend", function() {

    legend.show();
    legend.hide();

    waits(300);

    runs(function () {
      expect(legend.$el.css('display')).toEqual('none');
    });

  });

});
