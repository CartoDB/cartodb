describe("cdb.geo.ui.layer_selector", function() {

  describe("cdb.geo.ui.layer", function() {
    describe("model", function() {

      var model;

      beforeEach(function() {
        model = new cdb.geo.ui.Layer();
      });

      it("should be visible by default", function() {
        expect(model.get("visible")).toBeTruthy();
      });

    });

    describe("view", function() {

      var spyEvent, view, spy, model;

      beforeEach(function() {

        spy = {
          switchChanged: function() {
            console.log("a");
          }
        };

        spyEvent = spyOn(spy, "switchChanged");

        model = new cdb.geo.ui.Layer({
          options: {
            table_name: "table_name"
          }
        });

        view  = new cdb.geo.ui.LayerView({
          model: model,
        }).bind("switchChanged", spy.switchChanged, spy);

      });

      it("should change the select status when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(view.model.get("visible")).toBeFalsy();

        view.$el.find(".switch").click();
        expect(view.model.get("visible")).toBeTruthy();
      });

      /*it("should trigger a switchChanged event when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(spyEvent).toHaveBeenCalled();
      });

      it("should trigger a switchChanged event when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(spyEvent).toHaveBeenCalled();
      });*/

      it("should toggle the enabled/disabled classes when the switch button is clicked", function() {
        view.render();

        view.$el.find(".switch").click();
        expect(view.$el.find(".switch").hasClass("enabled")).toBeFalsy();
        expect(view.$el.find(".switch").hasClass("disabled")).toBeTruthy();

        view.$el.find(".switch").click();
        expect(view.$el.find(".switch").hasClass("enabled")).toBeTruthy();
        expect(view.$el.find(".switch").hasClass("disabled")).toBeFalsy();

      });

    });

  });

});
