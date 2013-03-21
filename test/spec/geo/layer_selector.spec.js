describe("cdb.geo.ui.layer_selector", function() {

  describe("cdb.geo.ui.layer_selector", function() {

    var view;

    beforeEach(function() {
      view  = new cdb.geo.ui.LayerSelector({
      template: _.template('<a href="#" class="layers">Visible layers<div class="count"><%= count %></div></a>')
      });
    });

  });

  describe("cdb.geo.ui.layer", function() {
    describe("model", function() {

      var model;

      beforeEach(function() {
        model = new cdb.geo.ui.Layer();
      });

      it("should be disabled by default", function() {
        expect(model.get("disabled")).toBeTruthy();
      });

      it("shouldn't be selected by default", function() {
        expect(model.get("selected")).toBeFalsy();
      });

    });

    describe("view", function() {

      var spyEvent, view, spy;

      beforeEach(function() {

        spy = {
          switchChanged: function() {}
        };

        spyEvent = spyOn(spy, "switchChanged");

        view  = new cdb.geo.ui.LayerView({
          name: "Layer name",
          template: '<a class="layer" href="#"><%= name %></a> <a href="#switch" class="right switch disabled"><span class="handle"></span></a>'
        }).bind("switchChanged", spy.switchChanged, spy);

      });

      it("should change the select status when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(view.model.get("selected")).toBeTruthy();
        expect(view.model.get("selected")).toBeTruthy();
      });

      it("should trigger a switchChanged event when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();

        expect(spyEvent).toHaveBeenCalledWith(true);
      });

      it("should toggle the enabled/disabled classes when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();

        expect(view.$el.find(".switch").hasClass("enabled")).toBeTruthy();
        expect(view.$el.find(".switch").hasClass("disabled")).toBeFalsy();

        view.$el.find(".switch").click();

        expect(view.$el.find(".switch").hasClass("enabled")).toBeFalsy();
        expect(view.$el.find(".switch").hasClass("disabled")).toBeTruthy();

      });

    });

  });

});
