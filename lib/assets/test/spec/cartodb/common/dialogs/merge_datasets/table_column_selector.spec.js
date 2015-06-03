describe('cdb.admin.TableColumnSelector', function() {
  describe("TableColumnSelectorEvents", function() {
    var selector, table;
    var onClickMergeMethod;

    beforeEach(function() {
      var schema = [ ['test', 'number'], ['test2', 'string'], ['the_geom', 'geometry'] ];

      onClickMergeMethod = spyOn(cdb.admin.TableColumnSelector.prototype, 'onClickMergeMethod');

      table = TestUtil.createTable('test', schema);

      selector = new cdb.admin.TableColumnSelector ({
        model: table
      });
    });

    it("should trigger an event when the user clicks in one of the merge methods", function() {
      selector.render();

      selector._showMergeMethods();
      selector.$el.find(".merge_methods li:first-child a").trigger("click");

      expect(onClickMergeMethod).toHaveBeenCalled();
    });
  });

  describe("TableColumnSelector", function() {
    var selector, table;

    beforeEach(function() {
      var schema = [
        ['the_geom', 'geometry'],
        ['field_a',   'number'],
        ['field_b',   'string'],
        ['field_c',   'string']
      ];

      table = TestUtil.createTable('test', schema);

      selector = new cdb.admin.TableColumnSelector ({
        model: table,
        source: "destiny"
      });
    });

    it("should open the dialog", function() {
      selector.render();
      expect(selector.$el.length > 0).toEqual(true);
    });

    it("should allow to show the merge methods", function() {
      selector.render();

      selector._showMergeMethods();
      expect(selector.$el.find(".merge_methods").css("display")).toEqual("block");
    });

    it("should select the merge method clicked", function() {
      selector.render();

      selector._showMergeMethods();
      selector.$el.find(".merge_methods li:first a").trigger("click");

      expect(selector.$el.find(".merge_methods li:first a").hasClass("selected")).toBeTruthy();
      expect(selector.$el.find(".merge_methods li:not(:first) a").hasClass("selected")).toBeFalsy();
    });

    it("should store the merge method clicked", function() {
      selector.render();

      selector.setJoinType("spatial");
      selector._showMergeMethods();

      // Select one method
      selector.$el.find(".merge_methods li:first a").trigger("click");
      selector.$el.find(".merge_methods li:first a").text();
      expect(selector.mergeMethod).toEqual("count");

      // Select other method
      selector.$el.find(".merge_methods li:last a").text();
      selector.$el.find(".merge_methods li:last a").trigger("click");
      expect(selector.mergeMethod).toEqual("avg");
    });

    it("should reset the merge method when the merge flavor is 'regular'", function() {
      selector.render();

      selector.setJoinType("spatial");
      selector._showMergeMethods();

      // Select other method
      selector.$el.find(".merge_methods li:last a").text();
      selector.$el.find(".merge_methods li:last a").trigger("click");
      expect(selector.mergeMethod).toEqual("avg");

      selector.setJoinType("regular");
      expect(selector.mergeMethod).toEqual(null);
    });

    it("should show or hide the merge methods list when the joinType changes", function() {
      selector.render();

      expect(selector.$el.find(".merge_methods").hasClass("hidden")).toBeTruthy();

      selector.setJoinType("spatial");

      expect(selector.$el.find(".merge_methods").not().hasClass("hidden")).toBeTruthy();
    });

    it("should have a column selected by default in a regular selector", function() {
      selector.render();

      selector.setJoinType("regular");
      selector._selectKeyByDefault();

      // eq(0) == the_geom; eq(1) == first column != the_Geom
      expect(selector.$el.find(".columns li:eq(1) a").hasClass("selected")).toBeTruthy();
    });

    it("should have a column selected by default in a spatial selector", function() {
      selector.render();
      selector.model.set("source", "destiny");

      selector.setJoinType("spatial");
      selector._selectKeyByDefault();

      // eq(0) == the_geom; eq(1) == first column != the_Geom
      expect(selector.$el.find(".columns li:eq(1) a").hasClass("selected")).toBeTruthy();
    });
  });
});
