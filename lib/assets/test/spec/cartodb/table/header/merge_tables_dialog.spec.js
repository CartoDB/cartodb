describe("MergeDialog", function() {

  describe("ColumnSelector", function() {

    var selector;
    var spy, listener;

    beforeEach(function() {

      var model = new cdb.admin.ColumnSelectorModel({
        name:           "name",
        joinType:       "regular",
        selected:       false,
        switchSelected: true,
        source:         "origin"
      });

      selector = new cdb.admin.ColumnSelector({
        model: model
      });

      listener = {
        listen: function() {}
      };

      spy = spyOn(listener, "listen");

    });

    it("should trigger an event when the user clicks in a radiobutton", function() {
      selector.render();

      selector.bind("keyColumn", listener.listen);

      selector.$el.find(".radiobutton").trigger("click");

      expect(spy).toHaveBeenCalled();

    });

    it("should allow to click in the radio button", function() {
      selector.render();

      selector.$el.find(".radiobutton").trigger("click");
      expect(selector.$el.find(".radiobutton").hasClass("selected")).toBeTruthy();

    });

    it("should allow to select the radio button", function() {
      selector.render();

      selector.model.set("selected", true);
      expect(selector.$el.find(".radiobutton").hasClass("selected")).toBeTruthy();

    });

    it("should allow to enable/disable the switch", function() {
      selector.render();

      selector.model.set("switchSelected", true);
      expect(selector.$el.find(".switch").hasClass("enabled")).toBeTruthy();
      expect(selector.$el.find(".switch").hasClass("disabled")).toBeFalsy();

      selector.model.set("switchSelected", false);
      expect(selector.$el.find(".switch").hasClass("enabled")).toBeFalsy();
      expect(selector.$el.find(".switch").hasClass("disabled")).toBeTruthy();

    });

    it("should allow to enable/disable the radio button", function() {
      selector.render();

      selector.model.set("enableRadio", true);
      expect(selector.$el.find(".radiobutton").hasClass("disabled")).toBeFalsy();

      selector.model.set("enableRadio", false);
      expect(selector.$el.find(".radiobutton").hasClass("disabled")).toBeTruthy();

    });

    it("should allow to show/hide the radio button", function(done) {
      selector.render();
      selector.model.set("showRadio", false);


      setTimeout(function() {
        expect(selector.$el.find(".radiobutton").hasClass("hidden_radio")).toBeTruthy();
        selector.model.set("showRadio", false);
        selector.model.set("showRadio", true);
        setTimeout(function() {
          expect(selector.$el.find(".radiobutton").hasClass("hidden_radio")).toBeFalsy();
          done();
        }, 500);
      }, 500);



    });

    it("should allow to show/hide the switch button", function() {
      selector.render();

      selector.model.set("showSwitch", true);
      expect(selector.$el.find(".switch").hasClass("hidden")).toBeFalsy();

      selector.model.set("showSwitch", false);
      expect(selector.$el.find(".switch").hasClass("hidden")).toBeTruthy();

    });

  });

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
        ['field_c',   'string'],
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
      var method = selector.$el.find(".merge_methods li:first a").text();
      expect(selector.mergeMethod).toEqual("count");

      // Select other method
      var method = selector.$el.find(".merge_methods li:last a").text();
      selector.$el.find(".merge_methods li:last a").trigger("click");
      expect(selector.mergeMethod).toEqual("avg");

    });

    it("should reset the merge method when the merge flavor is 'regular'", function() {
      selector.render();

      selector.setJoinType("spatial");
      selector._showMergeMethods();

      // Select other method
      var method = selector.$el.find(".merge_methods li:last a").text();
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

  describe("MergeTablesDialogEvents", function() {

    var dialog, table, onRadioButtonClicked;

    beforeEach(function() {

      table = TestUtil.createTable('test');

      onRadioButtonClicked = spyOn(cdb.admin.MergeTablesDialog.prototype, '_onRadioClick');

      dialog = new cdb.admin.MergeTablesDialog ({
        table: table
      });

    });

    it("should trigger event when one of the radio buttons are clicked", function() {
      dialog.render();

      var $radiobutton = dialog.$el.find("li:first-child .radiobutton");
      $radiobutton.trigger("click");

      expect(onRadioButtonClicked).toHaveBeenCalled();

    });

  });

  describe("MergeTablesDialog (number merge)", function() {

    var dialog, table, tableB, selector;

    beforeEach(function() {

      var schemaA = [
        ['the_geom', 'geometry'],
        ['field_a',   'number'],
        ['field_b',   'string'],
        ['field_c',   'string'],
      ];

      var schemaB = [
        ['the_geom', 'geometry'],
        ['field_d',   'number'],
        ['field_e',   'string']
      ];

      table  = TestUtil.createTable('a', schemaA);

      tableB = TestUtil.createTable('b', schemaB);

      selector = new cdb.admin.TableColumnSelector ({
        model: tableB,
        joinType: 'regular',
        source: 'destiny'
      });

      dialog = new cdb.admin.MergeTablesDialog ({
        table: table
      });

    });

    it("should generate a default query", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;
      dialog.model.set("merge_flavor", "regular");

      var queryResult = "SELECT a.the_geom, a.field_a, a.field_b, a.field_c, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";

      expect(selector.mergeColumns.length).toEqual(2);
      expect(selector.mergeColumns[0]).toEqual("field_d");
      expect(selector.mergeColumns[1]).toEqual("field_e");

      expect(dialog._generateQuery()).toEqual(queryResult);

    });

    it("should generate a default query after changing the switch model", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;
      dialog.model.set("merge_flavor", "regular");

      dialog.actual_table.subColumns[0].model.set("switchSelected", false);

      var queryResult = "SELECT a.field_a, a.field_b, a.field_c, b.field_d, b.field_e, b.the_geom FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";

      expect(dialog._generateQuery()).toEqual(queryResult);

    });

    it("should generate a valid query after clicking several switches", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;
      dialog.model.set("merge_flavor", "regular");

      expect(dialog.actual_table._getTheGeom().model.get("switchSelected")).toEqual(true);
      expect(dialog.merge_table._getTheGeom().model.get("switchSelected")).toEqual(false);

      dialog.actual_table.$el.find(".columns li:eq(0) .switch").click();
      expect(dialog.actual_table._getTheGeom().model.get("switchSelected")).toEqual(false);
      expect(dialog.merge_table._getTheGeom().model.get("switchSelected")).toEqual(true);

      dialog.actual_table.$el.find(".columns li:eq(0) .switch").click();

      expect(selector.mergeColumns.length).toEqual(2);
      expect(selector.mergeColumns[0]).toEqual("field_d");
      expect(selector.mergeColumns[1]).toEqual("field_e");

      expect(dialog.actual_table.mergeColumns.length).toEqual(4);
      expect(dialog.actual_table._getTheGeom().model.get("switchSelected")).toEqual(true);
      expect(dialog.actual_table.mergeColumns[0]).toEqual("field_a");
      expect(dialog.actual_table.mergeColumns[1]).toEqual("field_b");
      expect(dialog.actual_table.mergeColumns[2]).toEqual("field_c");
      expect(dialog.actual_table.mergeColumns[3]).toEqual("the_geom");

      expect(dialog.merge_table._getTheGeom().model.get("switchSelected")).toEqual(false);

      var queryResult = "SELECT a.field_a, a.field_b, a.field_c, a.the_geom, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";
      expect(dialog._generateQuery()).toEqual(queryResult);

    });

    it("should generate a valid query after clicking the select all switch in the origin table", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;
      dialog.model.set("merge_flavor", "regular");

      dialog.actual_table.$el.find(".merge_all .switch").click();

      expect(selector.mergeColumns.length).toEqual(3);
      expect(selector.mergeColumns[0]).toEqual("field_d");
      expect(selector.mergeColumns[1]).toEqual("field_e");
      expect(selector.mergeColumns[2]).toEqual("the_geom");

      expect(dialog.actual_table._getTheGeom().model.get("switchSelected")).toEqual(false);
      expect(dialog.actual_table.mergeColumns.length).toEqual(0);

      expect(dialog.merge_table._getTheGeom().model.get("switchSelected")).toEqual(true);

      var queryResult = "SELECT b.field_d, b.field_e, b.the_geom FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";
      expect(dialog._generateQuery()).toEqual(queryResult);

    });

    xit("should generate the right query after click merge_all", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;

      dialog.merge_table.bind("columnChanged",       dialog._onColumnChanged, dialog)
      dialog.merge_table.bind('tableSelected',       dialog._onTableSelected)
      dialog.merge_table.bind('mergeMethodSelected', dialog._mergeMethodSelected);

      dialog.model.set("merge_flavor", "regular");

      dialog.actual_table.$el.find(".merge_all .switch").click();
      dialog.merge_table.$el.find(".merge_all .switch").click();

      expect(selector.mergeColumns.length).toEqual(0);

      expect(dialog.actual_table._getTheGeom().model.get("switchSelected")).toEqual(false);
      expect(dialog.actual_table.mergeColumns.length).toEqual(1);
      expect(selector.mergeColumns[1]).toEqual("the_geom");

      expect(dialog.merge_table._getTheGeom().model.get("switchSelected")).toEqual(true);

      var queryResult = "SELECT a.the_geom FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";
      expect(dialog._generateQuery()).toEqual(queryResult);

    });

    it("should generate a well formated REGULAR query", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;

      dialog.model.set("merge_flavor", "regular");

      expect(dialog.model.get("merge_flavor")).toEqual("regular");

      // Let's change the key column on the merge_table
      dialog.actual_table.subColumns[2].model.set("switchSelected", false);
      dialog.actual_table.subColumns[3].model.set("switchSelected", false);

      // Check the key column names
      expect(dialog.actual_table.keyColumn).toEqual("field_a");
      expect(dialog.merge_table.keyColumn).toEqual("field_d");

      // Check the table names
      expect(dialog.actual_table.table_name).toEqual("a");
      expect(dialog.merge_table.table_name).toEqual("b");

      // Check the number of columns
      expect(dialog.actual_table.subColumns.length).toEqual(4);
      expect(dialog.merge_table.subColumns.length).toEqual(3);

      var query = dialog._generateQuery();

      var queryResult = "SELECT a.the_geom, a.field_a, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";

      expect(query).toEqual(queryResult);

    });

  });

  describe("MergeTablesDialog (string merge)", function() {

    var dialog, table, tableB, selector;

    beforeEach(function() {

      var schemaA = [
        ['the_geom', 'geometry'],
        ['field_a',   'string'],
        ['field_b',   'string'],
        ['field_c',   'string'],
      ];

      var schemaB = [
        ['the_geom', 'geometry'],
        ['field_d',   'string'],
        ['field_e',   'string']
      ];

      table  = TestUtil.createTable('a', schemaA);

      tableB = TestUtil.createTable('b', schemaB);

      selector = new cdb.admin.TableColumnSelector ({
        model: tableB,
        joinType: 'regular',
        source: 'destiny'
      });

      dialog = new cdb.admin.MergeTablesDialog ({
        table: table
      });

    });

    it("should generate a well formated SPATIAL COUNT query (1/3)", function() {

      var mergeMethod = 'count';
      var mergeFlavor = 'spatial';

      dialog.render();
      selector.render();

      dialog.merge_table = selector;

      dialog.model.set("merge_flavor", mergeFlavor);
      dialog.merge_table.mergeMethod = mergeMethod;

      // Check the key column names
      expect(dialog.actual_table.keyColumn).toEqual(null);
      expect(dialog.merge_table.keyColumn).toEqual("field_d");

      // Check the table names
      expect(dialog.actual_table.table_name).toEqual("a");
      expect(dialog.merge_table.table_name).toEqual("b");

      // Check the number of columns
      expect(dialog.actual_table.subColumns.length).toEqual(4);
      expect(dialog.merge_table.subColumns.length).toEqual(3);

      var query = dialog._generateQuery();

      var queryResult = "SELECT a.cartodb_id, a.the_geom_webmercator, a.the_geom, a.field_a, a.field_b, a.field_c, (SELECT COUNT(*) FROM b WHERE ST_Intersects(a.the_geom, b.the_geom)) AS intersect_count FROM a";

      expect(query).toEqual(queryResult);

    });

    it("should generate a well formated SPATIAL SUM query (1/3)", function() {

      var mergeMethod = 'sum';
      var mergeFlavor = 'spatial';

      dialog.render();
      selector.render();

      dialog.merge_table = selector;

      dialog.model.set("merge_flavor", mergeFlavor);
      dialog.merge_table.mergeMethod = mergeMethod;

      // Check the key column names
      expect(dialog.actual_table.keyColumn).toEqual(null);
      expect(dialog.merge_table.keyColumn).toEqual("field_d");

      // Check the table names
      expect(dialog.actual_table.table_name).toEqual("a");
      expect(dialog.merge_table.table_name).toEqual("b");

      // Check the number of columns
      expect(dialog.actual_table.subColumns.length).toEqual(4);
      expect(dialog.merge_table.subColumns.length).toEqual(3);

      var query = dialog._generateQuery();

      var queryResult = "SELECT a.cartodb_id, a.the_geom_webmercator, a.the_geom, a.field_a, a.field_b, a.field_c, (SELECT SUM(b.field_d) FROM b WHERE ST_Intersects(a.the_geom, b.the_geom)) AS intersect_sum FROM a";

      expect(query).toEqual(queryResult);

    });

    it("should generate a well formated SPATIAL AVG query (1/3)", function() {

      var mergeMethod = 'avg';
      var mergeFlavor = 'spatial';

      dialog.render();
      selector.render();

      dialog.merge_table = selector;

      dialog.model.set("merge_flavor", mergeFlavor);
      dialog.merge_table.mergeMethod = mergeMethod;

      // Check the key column names
      expect(dialog.actual_table.keyColumn).toEqual(null);
      expect(dialog.merge_table.keyColumn).toEqual("field_d");

      // Check the table names
      expect(dialog.actual_table.table_name).toEqual("a");
      expect(dialog.merge_table.table_name).toEqual("b");

      // Check the number of columns
      expect(dialog.actual_table.subColumns.length).toEqual(4);
      expect(dialog.merge_table.subColumns.length).toEqual(3);

      var query = dialog._generateQuery();

      var queryResult = "SELECT a.cartodb_id, a.the_geom_webmercator, a.the_geom, a.field_a, a.field_b, a.field_c, (SELECT AVG(b.field_d) FROM b WHERE ST_Intersects(a.the_geom, b.the_geom)) AS intersect_avg FROM a";

      expect(query).toEqual(queryResult);

    });


    it("should generate a well formated REGULAR query (4/4)", function() {

      dialog.render();
      selector.render();

      dialog.merge_table = selector;

      dialog.model.set("merge_flavor", "regular");

      expect(dialog.model.get("merge_flavor")).toEqual("regular");

      // Let's change the key column on the merge_table
      dialog.actual_table.subColumns[2].model.set("switchSelected", false);
      dialog.actual_table.subColumns[3].model.set("switchSelected", false);

      // Check the key column names
      expect(dialog.actual_table.keyColumn).toEqual("field_a");
      expect(dialog.merge_table.keyColumn).toEqual("field_d");

      // Check the table names
      expect(dialog.actual_table.table_name).toEqual("a");
      expect(dialog.merge_table.table_name).toEqual("b");

      // Check the number of columns
      expect(dialog.actual_table.subColumns.length).toEqual(4);
      expect(dialog.merge_table.subColumns.length).toEqual(3);

      var query = dialog._generateQuery();

      var queryResult = "SELECT a.the_geom, a.field_a, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON LOWER(a.field_a) = LOWER(b.field_d)";

      expect(query).toEqual(queryResult);

    });

    it("should open the dialog", function() {
      dialog.render();
      expect(dialog.$el.length > 0).toEqual(true);
    });

    it("should have title", function() {
      dialog.render();
      expect(dialog.$el.find("section:first-child .head > h3").text()).toEqual("Merge with another table");
    });

    it("should have two selector tables", function() {
      dialog.render();

      expect(dialog.actual_table).toBeDefined();
      expect(dialog.merge_table).toBeDefined();
    });

    it("should have an input", function() {
      dialog.render();

      expect(dialog.$input).toBeDefined();
      expect(dialog.$input.length > 0).toBeTruthy();
    });

    it("should have a title", function() {
      dialog.render();

      expect(dialog.$title).toBeDefined();
      expect(dialog.$title.length > 0).toBeTruthy();
      expect(dialog.$title.text()).toEqual('Merge with another table');

    });

    it("should have a description", function() {
      dialog.render();

      expect(dialog.$description).toBeDefined();
      expect(dialog.$description.length > 0).toBeTruthy();

    });

    it("should have a description title", function() {
      dialog.render();

      expect(dialog.$descriptionTitle).toBeDefined();
      expect(dialog.$descriptionTitle.length > 0).toBeTruthy();
      expect(dialog.$descriptionTitle.text()).toEqual('');

    });

    it("should have a next button", function() {
      dialog.render();

      expect(dialog.$next).toBeDefined();
      expect(dialog.$next.length > 0).toBeTruthy();
      expect(dialog.$next.text()).toEqual('Next');
    });

    it("should have a back button", function() {
      dialog.render();

      expect(dialog.$back).toBeDefined();
      expect(dialog.$back.length > 0).toBeTruthy();
      expect(dialog.$back.text()).toEqual('Go back');
    });

    it("should have a list of merge options", function() {
      dialog.render();

      expect(dialog.$mergeFlavorList).toBeDefined();
      expect(dialog.$mergeFlavorList.length > 0).toBeTruthy();
    });

    it("should have a table selector", function() {
      dialog.render();

      expect(dialog.$tableSelector).toBeDefined();
      expect(dialog.$tableSelector.length > 0).toBeTruthy();
    });

    it("should have a table name form", function() {
      dialog.render();

      expect(dialog.$tableNameForm).toBeDefined();
      expect(dialog.$tableNameForm.length > 0).toBeTruthy();
    });


    it("next button should be disabled on the begining", function() {
      dialog.render();
      expect(dialog.$next.hasClass('disabled')).toBeTruthy();
    });

    it("back button should be hidden on the begining", function() {
      dialog.render();
      expect(dialog.$back.hasClass("hidden")).toBeTruthy();
    });

    it("should increase the state value when clicking the enabled next button", function() {
      dialog.render();
      dialog.model.set("enableNext", true);

      dialog.$next.click();

      expect(dialog.model.get("state")).toEqual(1);
    });

    it("should decrease the state value when clicking the enabled back button", function() {
      dialog.render();
      dialog.model.set("enableBack", true);
      dialog.model.set("state", 1);

      dialog.$back.click();

      expect(dialog.model.get("state")).toEqual(0);
    });

    it("shouldn't increase the state value when clicking the disabled next button", function() {
      dialog.render();

      dialog.model.set("enableNext", false);
      dialog.$next.click();

      expect(dialog.model.get("state")).toEqual(0);
    });

    it("should load the next step when the user clicks in the next button", function() {
      dialog.render();

      dialog.model.set("enableNext", true);
      dialog.model.set("merge_flavor", "regular");

      dialog.$next.click();

      //expect(dialog.$el.find(".content").attr("data-name")).toEqual("regular-" + dialog.model.get("state"));
    });

    it("should disable the next button when the user clicks in the next button", function() {
      dialog.render();

      dialog.model.set("enableNext", true);
      dialog.model.set("merge_flavor", "regular");

      dialog.$next.click();

      expect(dialog.model.get("enableNext")).toEqual(false);
    });

    /*
    it("should allow to show/hide the merge flavor list", function() {
    dialog.render();

    dialog.model.set("show_merge_flavor_list", true);
    expect(dialog.$el.find(".join_types").length > 0).toBeTruthy();

    dialog.model.set("show_merge_flavor_list", false);
    expect(dialog.$el.find(".join_types").length > 0).toEqual(false);

    });

    it("should allow to show/hide the table selector", function() {
    dialog.render();

    dialog.model.set("show_table_selector", true);
    expect(dialog.$tableSelector.length > 0).toBeTruthy();

    dialog.model.set("show_table_selector", false);
    expect(dialog.$tableSelector.length > 0).toBeFalsy();

    });
    */

    it("should allow to enable/disable the next button", function() {
      dialog.render();

      dialog.model.set("enableNext", true);
      expect(dialog.$next.hasClass("disabled")).toBeFalsy();

      dialog.model.set("enableNext", false);
      expect(dialog.$next.hasClass("disabled")).toBeTruthy();
    });

    it("should allow to show/hide the back button", function() {
      dialog.render();

      dialog.model.set("enableBack", true);
      expect(dialog.$back.not().hasClass("hidden")).toBeTruthy();

      dialog.model.set("enableBack", false);
      expect(dialog.$back.hasClass("hidden")).toBeTruthy();
    });

    it("should allow to change the title", function() {
      dialog.render();

      var text = "New title";
      dialog.model.set("title", text);
      expect(dialog.$title.text()).toEqual(text);

    });

    it("should allow to change the description", function() {
      dialog.render();

      var text = "New description";
      dialog.model.set("description", text);
      expect(dialog.$description.text()).toEqual(text);
    });

    it("should allow to change the description title", function() {
      dialog.render();

      var text = "New title";
      dialog.model.set("description_title", text);
      expect(dialog.$descriptionTitle.text()).toEqual(text);
    });

    it("should allow to change the text of the next button", function() {
      dialog.render();

      var text = "Ok";

      dialog.model.set("nextButtonText", text);
      expect(dialog.$next.text()).toEqual(text);
    });

    it("should select the clicked radiobutton", function() {
      dialog.render();

      var $radiobutton = dialog.$el.find("li:first-child .radiobutton");
      $radiobutton.click();

      expect($radiobutton.hasClass("selected")).toBeTruthy();
    });

    it("should unselect not clicked radiobuttons", function() {
      dialog.render();

      var $radiobutton      = dialog.$el.find("li:first-child .radiobutton");
      var $otherRadioButton = dialog.$el.find("li:last-child .radiobutton");

      $radiobutton.click();

      expect($otherRadioButton.hasClass("selected")).toBeFalsy();
    });

    it("should enable the next option when a radiobutton is selected", function() {
      dialog.render();

      var $radiobutton = dialog.$el.find("li:first-child .radiobutton");
      $radiobutton.click();

      expect(dialog.model.get("enableNext")).toBeTruthy();
    });

    it("should set the flavor of the merge in the two tables when the merge flavor is changed", function() {
      dialog.render();

      dialog.model.set("merge_flavor", "spatial");
      expect(dialog.actual_table.options.joinType).toEqual("spatial");
      expect(dialog.merge_table.options.joinType).toEqual("spatial");

      dialog.model.set("merge_flavor", "regular");
      expect(dialog.actual_table.options.joinType).toEqual("regular");
      expect(dialog.merge_table.options.joinType).toEqual("regular");
    });

    it("should set the flavor of the merge when a radiobutton is selected", function() {
      dialog.render();

      dialog.$el.find(".radiobutton[data-merge-flavor='regular']").click();
      expect(dialog.model.get("merge_flavor")).toEqual("regular");

      dialog.$el.find(".radiobutton[data-merge-flavor='spatial']").click();
      expect(dialog.model.get("merge_flavor")).toEqual("spatial");
    });

    it("should set the flavor of the merge in the selector tables", function() {
      dialog.render();

      dialog.$el.find(".radiobutton[data-merge-flavor='regular']").click();
      expect(dialog.actual_table.options.joinType).toEqual("regular");
      expect(dialog.merge_table.options.joinType).toEqual("regular");

      dialog.$el.find(".radiobutton[data-merge-flavor='spatial']").click();
      expect(dialog.actual_table.options.joinType).toEqual("spatial");
      expect(dialog.merge_table.options.joinType).toEqual("spatial");
    });

    it("should enable the next button when the user selects a destination table", function(done) {
      dialog.render();

      dialog.$el.find(".radiobutton[data-merge-flavor='regular']").click();
      dialog.$el.find(".next").click();

      var val = dialog.merge_table.$el.find("select option:last-child").attr("value");
      dialog.merge_table._selectTable();


      setTimeout(function() {
        expect(dialog.model.get("enableNext")).toBeTruthy();
        done();
      }, 250);

    });

    it("should enable the regular merge when the table has enough columns", function() {

      dialog.render();
      selector.render();

      expect(dialog._canApplyRegularMerge()).toEqual(true);
      expect(dialog.$el.find("a[data-merge-flavor='regular']").parent().hasClass("disabled")).toEqual(false);

    });

  });

  describe("MergeTablesDialog: Regular Merge", function() {

    var dialog, table, tableB, selector;

    beforeEach(function() {

      var schemaA = [
        ['the_geom', 'geometry'],
        ['cartodb_id', 'integer'],
        ['created_at', 'date'],
        ['updated_at', 'date']
      ];

      var schemaB = [
        ['the_geom', 'geometry'],
        ['field_d',   'number'],
        ['field_e',   'string'],
        ['created_at', 'date'],
        ['updated_at', 'date']
      ];

      table  = TestUtil.createTable('a', schemaA);
      tableB = TestUtil.createTable('b', schemaB);

      selector = new cdb.admin.TableColumnSelector ({
        model: tableB,
        joinType: 'regular',
        source: 'destiny'
      });

      dialog = new cdb.admin.MergeTablesDialog ({
        table: table
      });

    });

    it("should disable the regular merge when the table doesn't have enough columns", function() {

      dialog.render();
      selector.render();

      expect(dialog._canApplyRegularMerge()).toEqual(false);
      expect(dialog.$el.find("a[data-merge-flavor='regular']").parent().hasClass("disabled")).toEqual(true);

    });
  });


});

