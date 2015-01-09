describe("cdb.admin.models.Overlay", function() {

  var model;

  beforeEach(function() {

    var defaultStyle = {
      "z-index":          5,
      "color":            "#ffffff",
      "text-align":       "left",
      "font-size":        10,
      "font-family-name": "Helvetica",
      "box-color":        "#000000",
      "box-opacity":      .7,
      "box-padding":      5,
      "line-color":       "#000000",
      "line-width":       50,
      "min-zoom": 3,
      "max-zoom": 40
    };

    var defaultOptions = {
      latlng: [20, 2],
      text: "I'm an **annotation overlay**",
      rendered_text: "I'm a <strong>annotation overlay</strong>" 
    };

    model = new cdb.admin.models.Overlay({
      type: "annotation",
      display: true,
      device: "desktop",
      extra: defaultOptions,
      style: defaultStyle
    });

  });

  it("should clone the attributes", function() {
    expect(_.isEqual(model.attributes, model.cloneAttributes())).toEqual(true);
  });

});
