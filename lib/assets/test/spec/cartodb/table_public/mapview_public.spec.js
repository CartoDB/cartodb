
describe("mapview public", function() {

  var view;

  beforeEach(function() {

var vizjson =  {id: "5ed698fa-cc85-11e3-a76b-003ee1fffe8b", version: "0.1.0", title: "untitled_table_5", description: null, url: null }

    view = new cdb.open.PublicMapTab({
      vizjson: vizjson,
      vizjson_url: "",
      model: new cdb.core.Model({
        bounds: false
      })
    });

  });

  it("should render", function() {
    view.render();
    expect(view.$('.cartodb-map').length).toEqual(1);
  });

  it("should not render the private components", function() {
    view.render();
    expect(view.$('.base_maps').length).toEqual(0);
    expect(view.$('.share').length).toEqual(0);
  })

});
