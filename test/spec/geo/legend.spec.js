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

    it("should have a 'none' type set by default", function() {
      expect(legend.model.get("type")).toEqual("none");
    });

    it("should use the provided model", function() {

      var legend = new cdb.geo.ui.Legend({
        data: data,
        map: map
      });

      expect(legend.model).toBeDefined();
      expect(legend.model.get("type")).toEqual("none");

    });

    it("should generate a model if no model is provided", function() {

      expect(legend.model).toBeDefined();
      expect(legend.model.get("type")).toEqual("none");

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
      expect(legend.$el.find("li:first-child").text().trim()).toEqual('Category 1');

      legend.items.at(0).set("name", "New Category 1")
      expect(legend.$el.find("li:first-child").text().trim()).toEqual('New Category 1');
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
      legend.model.set({ type: "custom" });
      legend.show();
      expect(legend.$el.css('display')).toEqual('block');
    });
    it("shouldn't show the 'none' legend", function() {
      legend.show();
      expect(legend.$el.css('display')).toEqual('none');
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

      var model = new cdb.core.Model({
        type: "color",
        title: "title",
        show_title: false,
      });
      model.items = new Backbone.Collection(data)

      legend = new cdb.geo.ui.ColorLegend({
        model: model
      });
    });

    it("should render boolean values and nulls", function() {
      legend.render();
      var bullets = legend.$('li');
      expect(bullets.length).toEqual(4);
      expect($(bullets[0]).text()).toEqual("		 true");
      expect($(bullets[1]).text()).toEqual("		 false");
      expect($(bullets[2]).text()).toEqual("		 #f1f1f1");
      expect($(bullets[3]).text()).toEqual("		 null");
    });
  });


  describe("Legend (public interface)", function() {

    var custom_data;

    afterEach(function() {
      $(".legend_playground").remove();
    });

    beforeEach(function() {

      custom_data = [
        { name: "Natural Parks",  value: "#58A062" },
        { name: "Villages",       value: "http://cartodb.com/assets/logos/logos_full_cartodb_light.png", type: "image" },
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

    it("should have a method to render the legend", function() {

      $("body").append("<div class='legend_playground' />");

      var legend = new cdb.geo.ui.Legend.Custom({
        title: "Custom title",
        data: custom_data
      });

      legend.addTo(".legend_playground");
      expect($(".legend_playground .cartodb-legend").length).toEqual(1);
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

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Custom title", data: custom_data };
        legend     = new cdb.geo.ui.Legend.Custom( properties );

        legend.render();

      });

      it("should generate a legend", function() {
        expect(legend.model.get("type")).toEqual("custom");
      });

      it("should show the items", function() {
        expect(legend.items.length).toEqual(custom_data.length);
        expect(legend.items.at(0).get("name")).toEqual(custom_data[0].name);
        expect(legend.items.at(0).get("value")).toEqual(custom_data[0].value);

        expect(legend.$el.find("li:first-child").text().trim()).toEqual(custom_data[0].name);
        expect(legend.$el.find("li:first-child .bullet").css("background")).toEqual("rgb(88, 160, 98)");
      });

      it("should show a title", function() {
        expect(legend.model.get("title")).toEqual(properties.title);
        expect(legend.$el.find(".legend-title").text()).toEqual(properties.title);
      });

      it("should allow to change the title", function() {
        legend.setTitle("New title");
        expect(legend.model.get("show_title")).toEqual(true);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual("New title");
      });

      it("should allow to change the items", function() {

        var new_data = [
          { name: "One", value: "#F1F1F1" },
          { name: "Too", value: "#FF00FF" }
        ];

        legend.setData(new_data);

        expect(legend.items.length).toEqual(new_data.length);

        expect(legend.items.at(0).get("name")).toEqual(new_data[0].name);
        expect(legend.items.at(0).get("value")).toEqual(new_data[0].value);

        expect(legend.$el.find("li:first-child").text().trim()).toEqual(new_data[0].name);
        expect(legend.$el.find("li:first-child .bullet").css("background")).toEqual("rgb(241, 241, 241)");

        expect(legend.$el.find("li:last-child").text().trim()).toEqual(new_data[1].name);
        expect(legend.$el.find("li:last-child .bullet").css("background")).toEqual("rgb(255, 0, 255)");
      });

    });

    describe("Category Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Category title", data: custom_data };
        legend     = new cdb.geo.ui.Legend.Category( properties );
        legend.render();

      });

      it("should generate the legend", function() {
        expect(legend.model.get("type")).toEqual("category");
      });

      it("should show the items", function() {
        expect(legend.items.length).toEqual(custom_data.length);
        expect(legend.items.at(0).get("name")).toEqual(custom_data[0].name);
        expect(legend.items.at(0).get("value")).toEqual(custom_data[0].value);

        expect(legend.$el.find("li:first-child").text().trim()).toEqual(custom_data[0].name);
        expect(legend.$el.find("li:first-child .bullet").css("background")).toEqual("rgb(88, 160, 98)");

        expect(legend.$el.find("li:nth-child(2)").text().trim()).toEqual(custom_data[1].name);
        expect(legend.$el.find("li:nth-child(2) .bullet").css("background")).toEqual("url(http://cartodb.com/assets/logos/logos_full_cartodb_light.png)");
      });

      it("should show a title", function() {
        expect(legend.model.get("title")).toEqual(properties.title);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual(properties.title);
      });

      it("should allow to change the title", function() {
        legend.setTitle("New title");
        expect(legend.model.get("show_title")).toEqual(true);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual("New title");
      });

    });

    describe("Bubble Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Bubble legend", type: "bubble", color: "#FF0000", min: 1, max: 120 };
        legend = new cdb.geo.ui.Legend.Bubble( properties );

        legend.render();

      });

      it("should generate the legend", function() {
        expect(legend.model.get("type")).toEqual(properties.type);
      });

      it("should show a graph with the right color", function() {
        expect(legend.$el.find(".graph").css("background-color")).toEqual("rgb(255, 0, 0)");
      });

      it("should show min and max values", function() {
        expect(legend.model.get("min")).toEqual(properties.min);
        expect(legend.model.get("max")).toEqual(properties.max);
      });

      it("should show a title", function() {
        expect(legend.model.get("title")).toEqual(properties.title);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual(properties.title);
      });

      it("should allow to change the title", function() {
        legend.setTitle("New title");
        expect(legend.model.get("show_title")).toEqual(true);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual("New title");
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
        var value = "3";

        legend.setMinValue(value)
        expect(legend.model.get("min")).toEqual(value);
        expect(legend.$el.find("ul li:nth-child(1)").text().trim()).toEqual(value);
      });

      it("should allow to change the max value", function() {
        var value = "10000";

        legend.setMaxValue(value)
        expect(legend.model.get("max")).toEqual(value);
        expect(legend.$el.find("ul li:nth-child(3)").text().trim()).toEqual(value);
      });

    });

    describe("Choropleth Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Choropleth title", type: "choropleth", colors: ["#DDD", "#FF000", "#F1F1F1"], left: "Left value", right: "Right value" };
        legend = new cdb.geo.ui.Legend.Choropleth(properties);
        legend.render();

      });

      it("should generate a legend", function() {
        expect(legend.model.get("type")).toEqual(properties.type);
      });

      it("should show left and right values", function() {
        expect(legend.model.get("leftLabel")).toEqual(properties.left);
        expect(legend.model.get("rightLabel")).toEqual(properties.right);
      });

      it("should show colors", function() {
        expect(legend.model.get("colors").length).toEqual(properties.colors.length);
        expect(legend.$el.find(".quartile").length).toEqual(properties.colors.length);
      });

      it("should show a title", function() {
        expect(legend.model.get("title")).toEqual(properties.title);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual(properties.title);
      });

      it("should allow to change the title", function() {
        legend.setTitle("New title");
        expect(legend.model.get("show_title")).toEqual(true);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual("New title");
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
        var label = "New left label";

        legend.setLeftLabel(label)
        expect(legend.model.get("leftLabel")).toEqual(label);
        expect(legend.$el.find("li:nth-child(1)").text().trim()).toEqual(label);
      });

      it("should allow change the right label", function() {
        var label = "New right label";

        legend.setRightLabel(label)
        expect(legend.model.get("rightLabel")).toEqual(label);
        expect(legend.$el.find("li:nth-child(2)").text().trim()).toEqual(label);
      });

    });

    describe("Density Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Density title", type: "density", colors: ["#DDD", "#FF000", "#F1F1F1"], left: "Left value", right: "Right value" };
        legend = new cdb.geo.ui.Legend.Density(properties);
        legend.render();

      });

      it("should generate a legend", function() {
        expect(legend.model.get("type")).toEqual(properties.type);
      });

      it("should show left and right values", function() {
        expect(legend.model.get("leftLabel")).toEqual(properties.left);
        expect(legend.model.get("rightLabel")).toEqual(properties.right);
      });

      it("should show colors", function() {
        expect(legend.model.get("colors").length).toEqual(properties.colors.length);
        expect(legend.$el.find(".quartile").length).toEqual(properties.colors.length);
      });

      it("should show a title", function() {
        expect(legend.model.get("title")).toEqual(properties.title);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual(properties.title);
      });

      it("should allow to change the title", function() {
        legend.setTitle("New title");
        expect(legend.model.get("show_title")).toEqual(true);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual("New title");
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
        expect(legend.$el.find("li:nth-child(1)").text().trim()).toEqual("Hello!");
      });

      it("should allow change the right label", function() {
        legend.setRightLabel("Hi!")
        expect(legend.model.get("rightLabel")).toEqual("Hi!");
        expect(legend.$el.find("li:nth-child(2)").text().trim()).toEqual("Hi!");
      });

    });

    describe("Intensity Legend", function() {

      var properties, legend;

      beforeEach(function() {

        properties = { title: "Intensity legend", type: "intensity", color: "#FF0000", min: 1, max: 120 };
        legend = new cdb.geo.ui.Legend.Intensity( properties );

        legend.render();

      });

      it("should generate the legend", function() {
        expect(legend.model.get("type")).toEqual(properties.type);
      });

      it("should show a graph with the right color", function() {
        var gradient = "-webkit-linear-gradient(left, rgb(255, 0, 0) 0%, rgb(255, 0, 0) 100%)";
        expect(legend.$el.find(".graph").css("background")).toEqual(gradient);
      });

      it("should show left and right values", function() {
        expect(legend.model.get("leftLabel")).toEqual(properties.left);
        expect(legend.model.get("rightLabel")).toEqual(properties.right);
      });

      it("should show a title", function() {
        expect(legend.model.get("title")).toEqual(properties.title);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual(properties.title);
      });

      it("should allow to change the title", function() {
        legend.setTitle("New title");
        expect(legend.model.get("show_title")).toEqual(true);
        expect(legend.$el.find(".legend-title").text().trim()).toEqual("New title");
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
        var gradient = "-webkit-linear-gradient(left, rgb(204, 204, 204) 0%, rgb(255, 255, 255) 100%)";
        expect(legend.$el.find(".graph").css("background")).toEqual(gradient);
      });

      it("should allow change the left label", function() {
        var label = "New left label";

        legend.setLeftLabel(label)
        expect(legend.model.get("leftLabel")).toEqual(label);
        expect(legend.$el.find("li:nth-child(1)").text().trim()).toEqual(label);
      });

      it("should allow change the right label", function() {
        var label = "New right label";

        legend.setRightLabel(label)
        expect(legend.model.get("rightLabel")).toEqual(label);
        expect(legend.$el.find("li:nth-child(2)").text().trim()).toEqual(label);
      });

    });

    describe("Stacked Legend (using data)", function() {

      afterEach(function() {
        $(".legend_playground").remove();
      });

      var stacked, properties, legendA, legendB, custom_data;

      var custom_data = [
        { name: "Natural Parks",  value: "#58A062" },
        { name: "Villages",       value: "#F07971" },
        { name: "Rivers",         value: "#54BFDE" },
        { name: "Fields",         value: "#9BC562" },
        { name: "Caves",          value: "#FABB5C" }
      ];

      beforeEach(function() {

        var legendA = { title: "Intensity legend", type: "intensity", color: "#FF0000", min: 1, max: 120 };
        var legendB = { title: "Custom title", type:"custom", data: custom_data };

        stacked = new cdb.geo.ui.Legend.Stacked({ data: [legendA, legendB] });

        stacked.render();

      });

      it("should have a method to render the stacked legend", function() {

        $("body").append("<div class='legend_playground' />");

        var legendA = { title: "Intensity legend", type: "intensity", color: "#FF0000", min: 1, max: 120 };
        var legendB = { title: "Custom title", type:"custom", data: custom_data };

        var stacked = new cdb.geo.ui.Legend.Stacked({ data: [legendA, legendB] });

        stacked.addTo(".legend_playground");
        expect($(".legend_playground .cartodb-legend-stack").length).toEqual(1);
      });

      it("should render", function() {
        expect(stacked.legends.length).toEqual(2);
        expect(stacked.$el.find(".cartodb-legend").length).toEqual(2);
        expect(stacked.$el.find(".cartodb-legend.intensity").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.custom").length).toEqual(1);
      });

      it("should allow to add a legend", function() {

        var properties = { title: "Density title", type: "density", colors: ["#DDD", "#FF000", "#F1F1F1"], left: "Left value", right: "Right value" };

        stacked.addLegend(properties);

        expect(stacked.legends.length).toEqual(3);

        expect(stacked.$el.find(".cartodb-legend").length).toEqual(3);
        expect(stacked.$el.find(".cartodb-legend.intensity").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.custom").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.density").length).toEqual(1);

      });

      it("should allow to remove a legend", function() {

        stacked.removeLegendAt(0);

        expect(stacked.legends.length).toEqual(1);

        expect(stacked.$el.find(".cartodb-legend").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.intensity").length).toEqual(0);
        expect(stacked.$el.find(".cartodb-legend.custom").length).toEqual(1);

      });

      it("should allow to get a legend", function() {

        var legend = stacked.getLegendAt(1);

        expect(legend.model.get("title")).toEqual("Custom title");
        expect(legend.$el.find(".legend-title").html()).toEqual("Custom title");

        var legend = stacked.legends[0];

        expect(legend.model.get("title")).toEqual("Intensity legend");
        expect(legend.$el.find(".legend-title").html()).toEqual("Intensity legend");

      });

    });

    describe("Stacked Legend (using legends)", function() {

      var stacked, properties, legendA, legendB, custom_data;

      var custom_data = [
        { name: "Natural Parks",  value: "#58A062" },
        { name: "Villages",       value: "#F07971" },
        { name: "Rivers",         value: "#54BFDE" },
        { name: "Fields",         value: "#9BC562" },
        { name: "Caves",          value: "#FABB5C" }
      ];

      var customLegend = new cdb.geo.ui.Legend.Custom({
        title: "Custom Legend",
        data: custom_data
      });

      var intensityLegend = new cdb.geo.ui.Legend.Intensity({
        title: "Intensity Legend",
        left: "10", right: "20", color: "#f1f1f1"
      });

      beforeEach(function() {

        stacked = new cdb.geo.ui.Legend.Stacked({ legends: [ customLegend, intensityLegend ] });
        stacked.render();

      });

      it("should render", function() {
        expect(stacked.legends.length).toEqual(2);
        expect(stacked.$el.find(".cartodb-legend").length).toEqual(2);
        expect(stacked.$el.find(".cartodb-legend.intensity").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.custom").length).toEqual(1);
      });

      it("should allow to add a legend", function() {

        var properties = { title: "Density title", type: "density", colors: ["#DDD", "#FF000", "#F1F1F1"], left: "Left value", right: "Right value" };

        stacked.addLegend(properties);

        expect(stacked.legends.length).toEqual(3);

        expect(stacked.$el.find(".cartodb-legend").length).toEqual(3);
        expect(stacked.$el.find(".cartodb-legend.intensity").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.custom").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.density").length).toEqual(1);

      });

      it("should allow to remove a legend", function() {

        stacked.removeLegendAt(0);

        expect(stacked.legends.length).toEqual(1);

        expect(stacked.$el.find(".cartodb-legend").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.intensity").length).toEqual(1);
        expect(stacked.$el.find(".cartodb-legend.custom").length).toEqual(0);

      });

      it("should allow to get a legend", function() {

        var legend = stacked.getLegendAt(0);

        expect(legend.model.get("title")).toEqual("Custom Legend");
        expect(legend.$el.find(".legend-title").html()).toEqual("Custom Legend");

        var legend = stacked.legends[1];

        expect(legend.model.get("title")).toEqual("Intensity Legend");
        expect(legend.$el.find(".legend-title").html()).toEqual("Intensity Legend");

      });

    });

  });

});
