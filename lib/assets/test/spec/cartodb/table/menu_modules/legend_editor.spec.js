
describe('cdb.admin.mod.LegendEditor ', function() {

  var legendEditor, availableLegends, view, dataLayer, legendModel, table, properties, intensity_properties;

  afterEach(function() {

    legendEditor.model.items.reset();

  });

  beforeEach(function() {

    legendModel = new cdb.geo.ui.LegendModel({ type: null });

    dataLayer         = new cdb.admin.CartoDBLayer();
    dataLayer.sync = function() {}
    table             = TestUtil.createTable('test');


    intensity_properties = {
        "marker-allow-overlap": true,
        "marker-fill": "#FFCC00",
        "marker-line-color": "#FFF",
        "marker-line-opacity": 1,
        "marker-line-width": 2,
        "marker-opacity": 0.9,
        "marker-placement": "point",
        "marker-type": "ellipse",
        "marker-width": 12
    };

    properties = {
      categories: [
        { color: "#A6CEE3", title: "title", title_type: "string", value_type: "color" },
        { color: "#F1F1F1", title: null, title_type: "string", value_type: "color" }
      ],
      "marker-allow-overlap": true,
      "marker-line-color": "#FFF",
      "marker-line-opacity": 1,
      "marker-line-width": 2,
      "marker-opacity": 0.9,
      "marker-placement": "point",
      "marker-type": "ellipse",
      "marker-width": 12,
      "property": "name"
    };

    dataLayer.wizard_properties.active("polygon", properties);
    dataLayer.table.set('geometry_types', ['st_point']);

    availableLegends = [
      { name: "none",       enabled: true  },
      { name: "custom",     enabled: true  },
      { name: "color",      enabled: false },
      { name: "category",   enabled: false },
      { name: "bubble",     enabled: false },
      { name: "choropleth", enabled: false },
      { name: "intensity",  enabled: false },
      { name: "density",    enabled: false },
    ];

    legendEditor = new cdb.admin.mod.LegendEditor({
      model: legendModel,
      dataLayer: dataLayer,
      className: "legends_panel",
      availableLegends: availableLegends
    });

    legendEditor.render();

    view = legendEditor.legend_panes.getPane("fields");

  });


  it('should have tabs and panes', function() {
    expect(legendEditor.legend_tabs).toBeDefined();
    expect(legendEditor.legend_panes).toBeDefined();
  });

  it('should have panes', function() {
    expect(view.panes).toBeDefined();
  });

  it('should have a combo', function() {
    expect(view.templates).toBeDefined();
  });

  it('should render the "none" pane by default', function() {
    var text = view.$el.find(".none").text().replace(/^\s+|\s+$/g, '');
    expect(text).toEqual("Enable your legend by selecting a template from the selector above.");
  });

  it('should contain two templates activated by default', function() {

    var templateOptions = view.templates.data;

    expect(templateOptions.length).toEqual(2);
    expect(templateOptions[0]).toEqual("none");
    expect(templateOptions[1]).toEqual("custom");

  });

  it('should render the panes', function() {
    expect(_.size(view.panes.tabs)).toEqual(availableLegends.length);
    expect(view.panes.$el.find("div").length).toEqual(availableLegends.length + 1); // + 1 = the empty pane message
  });

  it('should change the template combo when the user selects a new option in the combo', function() {
    view.$('select').val('custom').change();
    expect(legendModel.get("type")).toEqual("custom");
  });

  it('should change the pane when the template combo is changed', function() {
    view.$('select').val('custom').change();
    expect(view.panes.$el.find(".none").css("display")).toEqual("none");
    expect(view.panes.$el.find(".custom").css("display")).toEqual("block");
  });

  it('should add items', function() {
    view.$('select').val('custom').change();

    view.$el.find(".add").click();
    view.$el.find(".add").click();
    view.$el.find(".add").click();

    expect(view.$el.find(".custom ul li span.field").length).toEqual(4);

  });

  it('should change the title', function() {

    view.$('select').val('custom').change();
    view.model.set("title", "this is a title");

    expect(view.$el.find(".custom ul li.title span:last-child").text()).toEqual("this is a title");
  });

  it('should select a different pane when the wizard changes', function() {

    dataLayer.wizard_properties.active("polygon", properties);

    //expect(view.panes.$el.find(".none").css("display")).toEqual("none");
    //expect(view.panes.$el.find(".custom").css("display")).toEqual("block");

    dataLayer.wizard_properties.active("category", properties);

    expect(view.panes.$el.find(".none").css("display")).toEqual("none");
    expect(view.panes.$el.find(".custom").css("display")).toEqual("none");
    expect(view.panes.$el.find(".category").css("display")).toEqual("block");

  });

  it('should change the combo when the wizard changes', function() {

    dataLayer.wizard_properties.active("category", properties);
    var templateOptions = view.templates.data;

    expect(templateOptions.length).toEqual(3);
    expect(templateOptions[0]).toEqual("none");
    expect(templateOptions[1]).toEqual("custom");
    expect(templateOptions[2]).toEqual("category");

  });

  it('should render the new pane when the wizard changes', function() {
    dataLayer.wizard_properties.active("category", properties);
    var templateOptions = view.templates.data;

    expect(view.model.get("type")).toEqual("category");
    expect(view.$el.find(".category").css("display")).toEqual("block");
    expect(view.$el.find(".choropleth").css("display")).toEqual("none");
  });

  it('should update color items when the wizard changes', function() {

    properties.categories[0].color = "red";
    dataLayer.wizard_properties.active("category", properties);

    expect(view.model.get("type")).toEqual("category");
    expect(view.$el.find(".none").css("display")).toEqual("none");
    expect(view.$el.find(".custom").css("display")).toEqual("none");
    expect(view.$el.find(".category").css("display")).toEqual("block");

    expect(view.$el.find(".category li span.field .form_color .color-picker").css("background-color")).toEqual("red");

  });

  it('should generate the custom legend from the category legend', function() {

    properties.categories[0].color = "red";
    dataLayer.wizard_properties.active("category", properties);

    expect(view.model.get("type")).toEqual("category");
    expect(view.$el.find(".custom").css("display")).toEqual("none");
    expect(view.$el.find(".category").css("display")).toEqual("block");

    expect(view.$el.find(".category li span.field .form_color .color-picker").css("background-color")).toEqual("red");

    view.model.set("type", "custom");

    expect(view.$el.find(".custom").css("display")).toEqual("block");
    expect(view.$el.find(".category").css("display")).toEqual("none");
    expect(view.$el.find(".custom li span.field .form_color .color-picker").css("background-color")).toEqual("red");

  });

  it('should restore the state of the custom legend pane', function() {

    view.model.set("type", "custom");
    view.model.items.reset( { name: "Remember me", value: "#F1F1F1" });

    dataLayer.wizard_properties.active("intensity", intensity_properties);
    expect(view.model.get("type")).toEqual("custom");
    /*
    expect(view.$el.find(".custom").css("display")).toEqual("none");
    expect(view.$el.find(".intensity").css("display")).toEqual("block");
    expect(view.$el.find(".intensity li span.field .form_color span.color").css("background-color")).toEqual("rgb(255, 204, 0)");

    view.model.set("type", "custom");
    expect(view.$el.find(".custom li span.field .form_color span.color").css("background-color")).toEqual("rgb(241, 241, 241)");
    expect(view.$el.find(".custom li:last-child .value span").text()).toEqual("Remember me");
    */

  });

  it('should change the type of legend when the wizard changes', function() {

    dataLayer.wizard_properties.active("category", properties);
    expect(legendModel.get("type")).toEqual("category");
    expect(view.panes.getActivePane()._FILTER_NAME).toEqual("category");

    dataLayer.wizard_properties.active("polygon", properties);
    expect(legendModel.get("type")).toEqual("none");

    expect(view.panes.getActivePane()._FILTER_NAME).toEqual("none");

  });

  it('should select the empty legend when the type doesn\'t exist', function() {

    view.$('select').val('custom').change();

    dataLayer.wizard_properties.active("polygon", properties);
    expect(legendModel.get("type")).toEqual("custom");

  });

  it('shouldn change the type of the legend when the wizard changes even if the user has decided not to have a legend', function() {

    view.$('select').val('custom').change();

    legendModel.set("type", "none")

    dataLayer.wizard_properties.active("category", properties);
    expect(view.templates.$el.find(".select2-choice span").text()).toEqual("category");
    expect(legendModel.get("type")).toEqual("category");

  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  })

});


describe('cdb.admin.mod.LegendEditor: choropleth', function() {

  var legendEditor, availableLegends, view, dataLayer, legendModel, table,  properties;

  afterEach(function() {

    legendEditor.model.items.reset();

  });

  beforeEach(function() {

    legendModel = new cdb.geo.ui.LegendModel({ type: "choropleth" });

    dataLayer         = new cdb.admin.CartoDBLayer();
    dataLayer.sync = function() {}
    wizardProperties  = new Backbone.Model();
    table             = TestUtil.createTable('test');

    properties = {
      categories: [
        { color: "#A6CEE3", title: "title", title_type: "string", value_type: "color" },
        { color: "#F1F1F1", title: null, title_type: "string", value_type: "color" }
      ],
      "marker-allow-overlap": true,
      "marker-line-color": "#FFF",
      "marker-line-opacity": 1,
      "marker-line-width": 2,
      "marker-opacity": 0.9,
      "marker-placement": "point",
      "marker-type": "ellipse",
      "marker-width": 12,
      "property": "name"
    };


    dataLayer.table.set('geometry_types', ['st_point']);
    dataLayer.wizard_properties.active("choropleth", properties);

    availableLegends = [
      { name: "none",       enabled: true  },
      { name: "custom",     enabled: true  },
      { name: "color",      enabled: false },
      { name: "category",   enabled: false },
      { name: "bubble",     enabled: false },
      { name: "choropleth", enabled: false },
      { name: "intensity",  enabled: false },
      { name: "density",    enabled: false },
    ];

    legendEditor = new cdb.admin.mod.LegendEditor({
      model: legendModel,
      dataLayer: dataLayer,
      className: "legends_panel",
      availableLegends: availableLegends
    });

    legendEditor.render();

    view = legendEditor.legend_panes.getPane("fields");

  });

  it('should have panes', function() {
    expect(view.panes).toBeDefined();
  });


  it('should render the "choropleth" pane by default', function() {
    var templateOptions = view.templates.data;

    expect(templateOptions.length).toEqual(3);
    expect(templateOptions[0]).toEqual("none");
    expect(templateOptions[1]).toEqual("custom");
    expect(templateOptions[2]).toEqual("choropleth");
  });

  it('should contain three templates activated by default', function() {

    var templateOptions = view.templates.data;

    expect(templateOptions.length).toEqual(3);
    expect(templateOptions[0]).toEqual("none");
    expect(templateOptions[1]).toEqual("custom");
    expect(templateOptions[2]).toEqual("choropleth");

  });

  it('should render the panes', function() {
    expect(_.size(view.panes.tabs)).toEqual(availableLegends.length);
    expect(view.panes.$el.find("> div").length).toEqual(availableLegends.length);
  });


});
