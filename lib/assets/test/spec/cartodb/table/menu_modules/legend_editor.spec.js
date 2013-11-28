
describe('cdb.admin.mod.LegendEditor ', function() {

  var legendEditor, panes, view, dataLayer, legendModel, table, wizardProperties, properties;

  beforeEach(function() {

    legendModel = new cdb.geo.ui.LegendModel({ type: null });

    dataLayer         = new Backbone.Model();
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

    dataLayer.set("wizard_properties", { type: "null", properties: properties });

    panes = [
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
      legends: panes
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
    expect(_.size(view.panes.tabs)).toEqual(panes.length);
    expect(view.panes.$el.find("div").length).toEqual(panes.length + 1); // + 1 = the empty pane message
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

  xit('should add an item', function() {
    view.$('select').val('custom').change();

    view.$el.find(".add").click();

    expect(view.$el.find(".custom ul li").length).toEqual(2);

  });

  it('should select a different pane when the wizard changes', function() {

    dataLayer.set("wizard_properties", { type: "custom", properties: properties })

    expect(view.panes.$el.find(".none").css("display")).toEqual("none");
    expect(view.panes.$el.find(".custom").css("display")).toEqual("block");

  });

  it('should change the combo when the wizard changes', function() {

    dataLayer.set("wizard_properties", { type: "category", properties: properties })
    var templateOptions = view.templates.data;

    expect(templateOptions.length).toEqual(3);
    expect(templateOptions[0]).toEqual("none");
    expect(templateOptions[1]).toEqual("custom");
    expect(templateOptions[2]).toEqual("category");

  });

  it('should render the new pane when the wizard changes', function() {

    dataLayer.set("wizard_properties", { type: "category", properties: properties })
    var templateOptions = view.templates.data;


    expect(view.model.get("type")).toEqual("category");
    expect(view.$el.find(".category").css("display")).toEqual("block");
    expect(view.$el.find(".choropleth").css("display")).toEqual("none");

  });

  it('should change the type of legend when the wizard changes', function() {

    dataLayer.set("wizard_properties", { type: "category", properties: properties })
    expect(legendModel.get("type")).toEqual("category");
    expect(view.currentLegendPane._FILTER_NAME).toEqual("category");

    dataLayer.set("wizard_properties", { type: "none", properties: properties })
    expect(legendModel.get("type")).toEqual("none");

    expect(view.currentLegendPane._FILTER_NAME).toEqual("none");

  });

  it('should change the type of legend when the wizard changes', function() {

    view.$('select').val('custom').change();

    dataLayer.set("wizard_properties", { type: "oh, what's that?", properties: properties })
    expect(legendModel.get("type")).toEqual("none");

    dataLayer.set("wizard_properties", { type: "category", properties: properties })
    expect(view.templates.$el.find(".select2-choice span").text()).toEqual("category");

  });

  it('should change the selected option to none in the combo when the wizard changes to a non-existant legend type', function() {

    view.$('select').val('custom').change();

    dataLayer.set("wizard_properties", { type: "none" })
    expect(view.templates.$el.find(".select2-choice span").text()).toEqual("none");

  });

  it('should change the selected option to none when the wizard changes to a non-existant legend type', function() {

    view.$('select').val('custom').change();

    dataLayer.set("wizard_properties", { type: "something-something" })
    expect(view.templates.$el.find(".select2-choice span").text()).toEqual("none");

  });

});


describe('cdb.admin.mod.LegendEditor 2 ', function() {

  var legendEditor, panes, view, dataLayer, legendModel, table, wizardProperties, properties;

  beforeEach(function() {

    legendModel = new cdb.geo.ui.LegendModel({ type: "choropleth" });

    dataLayer         = new Backbone.Model();
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


    dataLayer.set("wizard_properties", { type: "choropleth", properties: properties });

    panes = [
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
      legends: panes
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

});

