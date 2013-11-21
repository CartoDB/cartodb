describe("common.geo.ui.Legend", function() {

  describe("Legend", function() {

    var data, legend, map;

    afterEach(function() {
      legend.clean();
    });

    beforeEach(function() {

      map = new cdb.geo.Map();

      data = [
        { name: "Category 1", value: "#f1f1f1" },
        { name: "Category 2", value: "red" },
        { name: "Category 3", value: "#f1f1f1" },
        { name: "Category 4", value: "#ccc" },
      ];

      legend = new cdb.geo.ui.Legend({
        data: data,
        map: map
      });

      $("body").append(legend.render().$el);

    });

    it("should have a 'null' type set by default", function() {
      expect(legend.model.get("type")).toEqual(null);
    });

    it("should use the provided model", function() {

      var legend = new cdb.geo.ui.Legend({
        data: data,
        map: map
      });

      expect(legend.model).toBeDefined();
      expect(legend.model.get("type")).toEqual(null);

    });

    it("should generate a model if no model is provided", function() {

      expect(legend.model).toBeDefined();
      expect(legend.model.get("type")).toEqual(null);

    });

    it("should allow to change type", function() {
      legend.model.set({ type: "bubble" });
      expect(legend.model.get("type")).toEqual('bubble');
    });

    it("should have a collection", function() {
      expect(legend.items instanceof cdb.geo.ui.LegendItems).toEqual(true);
    });

    it("should populate the collection", function() {
      legend.model.set("type", "custom");
      expect(legend.model.items.length).toEqual(4);

      for (var i = 0; i < data.length; i++) {
        expect(legend.model.items.at(i).get("name")).toEqual(data[i].name);
      }

    });

    it("should set the type of the legend in the element", function() {
      legend.model.set({ type: "bubble" });
      legend.render();
      expect(legend.$el.hasClass("bubble")).toEqual(true);
    });

    it("should create the specific legend based on the type", function() {
      legend.model.set({ type: "bubble" });
      expect(legend.view instanceof cdb.geo.ui.BubbleLegend).toEqual(true);
      expect(legend.$el.hasClass("bubble")).toEqual(true);
      expect(legend.$el.hasClass("custom")).toEqual(false);
    });

    it("shouldn't create the legend if the type is unknown", function() {
      legend.model.set({ type: "the_legend_of_santana" });
      expect(legend.view instanceof cdb.geo.ui.CustomLegend).toEqual(false);
      expect(legend.$el.hasClass("custom")).toEqual(false);
    });

    it("should update the legend when the name of an item is changed", function() {
      legend.render();
      legend.model.set({ type: "custom" });
      expect(legend.$el.find("li:first-child").text()).toEqual('Category 1');

      legend.items.at(0).set("name", "New Category 1")
      expect(legend.$el.find("li:first-child").text()).toEqual('New Category 1');
    });

    it("should update the legend when the value of an item is changed", function() {
      legend.render();
      legend.model.set({ type: "custom" });
      expect(legend.$el.find("li:first-child .bullet").css("background-color")).toEqual('rgb(241, 241, 241)');

      legend.items.at(0).set("value", "red")
      expect(legend.$el.find("li:first-child .bullet").css("background-color")).toEqual('rgb(255, 0, 0)');
    });


    it("should have a title defined", function() {
      expect(legend.model.get("title")).toBeDefined();
    });

    it("should have a show_title defined", function() {
      legend.model.set({ type: "custom" });
      expect(legend.model.get("show_title")).toBeDefined();
    });

    it("should show the legend", function() {
      legend.show();
      expect(legend.$el.css('display')).toEqual('block');
    });

    it("should hide the legend", function() {

      legend.model.set({ type: "bubble" });

      legend.show();
      legend.hide();

      waits(300);

      runs(function () {
        expect(legend.$el.css('display')).toEqual('none');
      });

    });

    it("should render the title if title and show_title are set", function() {
      var title = "Hi, I'm a title";
      legend.model.set({ type: "custom", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);

      legend.model.set({ type: "bubble", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);

      legend.model.set({ type: "density", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);

      legend.model.set({ type: "intensity", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);

      legend.model.set({ type: "color", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);

      legend.model.set({ type: "category", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);

      legend.model.set({ type: "choropleth", title: title, show_title: true });
      expect(legend.$el.find('.legend-title').text()).toEqual(title);
    });

    it("shouldn't render the title if show_title is not true", function() {
      var title = "Hi, I'm a title";
      legend.model.set({ type: "custom", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);

      legend.model.set({ type: "bubble", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);

      legend.model.set({ type: "density", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);

      legend.model.set({ type: "intensity", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);

      legend.model.set({ type: "color", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);

      legend.model.set({ type: "category", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);

      legend.model.set({ type: "choropleth", title: title, show_title: false });
      expect(legend.$el.find('.legend-title').text()).not.toEqual(title);
    });

  });

  describe("StackedLegend", function() {

    var data, legends, legendA, legendB, stackedLegend;

    afterEach(function() {
      stackedLegend.clean();
    });

    beforeEach(function() {

      data = [
        { name: "Category 1", value: "#f1f1f1" },
        { name: "Category 2", value: "red" },
        { name: "Category 3", value: "#f1f1f1" },
        { name: "Category 4", value: "#ccc" },
      ];

      legendA = new cdb.geo.ui.Legend({
        data: data
      });

      legendB = new cdb.geo.ui.Legend({
        data: data
      });

      legends = [ legendA, legendB ];

      stackedLegend = new cdb.geo.ui.StackedLegend({
        legends: legends
      });

      $("body").append(stackedLegend.render().$el);

    });

    xit("should have a collection of items", function() {
      expect(stackedLegend.items instanceof cdb.geo.ui.StackedLegendItems).toEqual(true);
    });

    xit("should populate the collection", function() {
      expect(stackedLegend.items.length).toEqual(2);

      //for (var i = 0; i < legends.length; i++) {
      //expect(stackedLegend.items.at(i).toJSON()).toEqual(legends[i]);
      //}

    });

    //it("should generate one element", function() {
    //stackedLegend.render();
    //expec(stackedLegend.$el);
    //});

  });

  describe("ColorLegend", function() {
    var legend;
    beforeEach(function() {
      var data = [
        { name: true, value: "red" },
        { name: false, value: "red"  },
        { name: "#f1f1f1", value: "red"  },
        { name: null, value: "red"  },
      ];

      legend = new cdb.geo.ui.ColorLegend({
        items: new Backbone.Collection(data)
      });
    });

    it("should render boolean values and nulls", function() {
      legend.render();
      var bullets = legend.$('li');
      expect(bullets.length).toEqual(4);
      expect($(bullets[0]).text()).toEqual("true");
      expect($(bullets[1]).text()).toEqual("false");
      expect($(bullets[2]).text()).toEqual("#f1f1f1");
      expect($(bullets[3]).text()).toEqual("null");
    });
  });


  describe("Legend (public interface)", function() {

    var custom_data;

    beforeEach(function() {

      custom_data = [
        { name: "Natural Parks",  value: "#58A062" },
        { name: "Villages",       value: "#F07971" },
        { name: "Rivers",         value: "#54BFDE" },
        { name: "Fields",         value: "#9BC562" },
        { name: "Caves",          value: "#FABB5C" }
      ];

    });

    it("should allow to show/hide the title", function() {

      var title = "Custom title";

      var legend = new cdb.geo.ui.Legend.Custom({
        title: title,
        data: custom_data
      });

      legend.render();
      legend.model.set("show_title", false);

      expect(legend.$el.find(".legend-title").html()).toEqual(null);

      legend.model.set("show_title", true);
      expect(legend.$el.find(".legend-title").html()).toEqual(title);

      legend.hideTitle();
      expect(legend.$el.find(".legend-title").html()).toEqual(null);

      legend.showTitle();
      expect(legend.$el.find(".legend-title").html()).toEqual(title);

    });

    it("should render the title", function() {

      var legend = new cdb.geo.ui.Legend.Custom({
        title: "Custom title",
        data: custom_data
      });

      legend.render();

      expect(legend.$el.find(".legend-title").html()).toEqual("Custom title");

    });

    it("shouldn't render the title if it's not provided", function() {

      var legend = new cdb.geo.ui.Legend.Custom({
        data: custom_data
      });

      legend.render();

      expect(legend.$el.find(".legend-title").html()).toEqual(null);

    });


    describe("Custom Legend", function() {

      it("should generate a custom legend", function() {

        var legend = new cdb.geo.ui.Legend.Custom({
          title: "Custom title",
          data: custom_data
        });

        expect(legend.model.get("type")).toEqual("custom");
        expect(legend.model.get("title")).toEqual("Custom title");
        expect(legend.items.length).toEqual(5);

        expect(legend.items.at(0).get("name")).toEqual(custom_data[0].name);
        expect(legend.items.at(0).get("value")).toEqual(custom_data[0].value);

      });

    });

    describe("Bubble Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Bubble legend", type: "bubble", color: "#FF0000", min: 1, max: 120 };
        legend = new cdb.geo.ui.Legend.Bubble( properties );

        legend.render();

      });

      it("should generate a bubble legend", function() {

        expect(legend.model.get("type")).toEqual(properties.type);
        expect(legend.model.get("title")).toEqual(properties.title);

        expect(legend.model.get("min")).toEqual(properties.min);
        expect(legend.model.get("max")).toEqual(properties.max);

        expect(legend.$el.find(".graph").css("background-color")).toEqual("rgb(255, 0, 0)");

      });

      it("should allow to show the title", function() {
        legend.hideTitle();
        legend.showTitle();
        expect(legend.$el.find(".legend-title").html()).toEqual(properties.title);
      });

      it("should allow to hide the title", function() {
        legend.hideTitle();
        expect(legend.$el.find(".legend-title").html()).toEqual(null);
      });

      it("should allow to change the color", function() {
        legend.setColor("#CCC");
        expect(legend.$el.find(".graph").css("background-color")).toEqual("rgb(204, 204, 204)");
      });

      it("should allow to change the min value", function() {
        legend.setMinValue("3")
        expect(legend.model.get("min")).toEqual("3");
        expect(legend.$el.find("ul li:first-child").text()).toEqual("3");
      });

      it("should allow to change the max value", function() {
        legend.setMaxValue("10000")
        expect(legend.model.get("max")).toEqual("10000");
        expect(legend.$el.find("ul li:last-child").text()).toEqual("10000");
      });

    });

    describe("Density Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Density title", type: "density", colors: ["#DDD", "#FF000", "#F1F1F1"], left: "Left value", right: "Right value" };
        legend = new cdb.geo.ui.Legend.Density(properties);
        legend.render();

      });

      it("should allow to generate a density legend", function() {
        expect(legend.model.get("type")).toEqual(properties.type);
        expect(legend.model.get("title")).toEqual(properties.title);

        expect(legend.model.get("leftLabel")).toEqual(properties.left);
        expect(legend.model.get("rightLabel")).toEqual(properties.right);

        expect(legend.model.get("colors").length).toEqual(properties.colors.length);
        expect(legend.$el.find(".quartile").length).toEqual(properties.colors.length);
      });

      it("should allow to hide the title", function() {
        legend.hideTitle();
        expect(legend.$el.find(".legend-title").html()).toEqual(null);
      });

      it("should allow to show the title", function() {
        legend.hideTitle();
        legend.showTitle();
        expect(legend.$el.find(".legend-title").html()).toEqual(properties.title);
      });

      it("should allow change colors", function() {
        var newColors = ["red", "white", "blue"];

        legend.setColors(newColors);
        expect(legend.model.get("colors").length).toEqual(newColors.length);
        expect(legend.$el.find(".quartile").length).toEqual(newColors.length);
      });

      it("should allow change the left label", function() {
        legend.setLeftLabel("Hello!")
        expect(legend.model.get("leftLabel")).toEqual("Hello!");
      });

      it("should allow change the right label", function() {
        legend.setRightLabel("Hi!")
        expect(legend.model.get("rightLabel")).toEqual("Hi!");
      });

    });

  });

});
