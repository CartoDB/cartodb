var $ = require('jquery');
var MergeDatasetsView = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_datasets_view');

describe('common/dialog/merge_datasets/merge_datasets_view', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('test');

    this.view = new MergeDatasetsView({
      table: this.table
    });
    this.view.render();
  });

  it('should display start view', function() {
    expect(this.innerHTML()).toContain('js-merge-flavors-list');
    expect(this.innerHTML()).not.toMatch('js-merge-flavors-list.*display');
    expect(this.innerHTML()).toMatch('js-table-selector.*display: none');
  });

  describe('when merge type (column) is clicked', function() {
    beforeEach(function() {
      $(this.view.$('.js-merge-flavor')[0]).click();
    });

    it('should render the next view', function() {
      expect(this.innerHTML()).toMatch('js-merge-flavors-list.*display: none');
      expect(this.innerHTML()).toMatch('js-table-selector.*display: block');
    });

    it('should set the flavor of the merge in the selector tables', function() {
      expect(this.view.actual_table.options.joinType).toEqual('regular');
      expect(this.view.merge_table.options.joinType).toEqual('regular');
    });

    describe('when click back', function() {
      beforeEach(function() {
        this.view.$('.js-back').click();
      });

      it('should display start view again', function() {
        expect(this.innerHTML()).toMatch('js-merge-flavors-list.*display: block');
        expect(this.innerHTML()).toMatch('js-table-selector.*display: none');
      });
    });

    describe('when click spatial merge type', function() {
      beforeEach(function() {
        $(this.view.$('.js-merge-flavor')[1]).click();
      });

      it('should set the flavor of the merge in the selector tables', function() {
        expect(this.view.actual_table.options.joinType).toEqual('spatial');
        expect(this.view.merge_table.options.joinType).toEqual('spatial');
      });
    });
  });

  describe("number merge)", function() {
    var dialog, table, tableB, selector;

    beforeEach(function() {
      var schemaA = [
        ['the_geom', 'geometry'],
        ['field_a',   'number'],
        ['field_b',   'string'],
        ['field_c',   'string']
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

      dialog = new MergeDatasetsView({
        table: table
      });
    });

    it("should generate a default query", function() {
      dialog.render();
      selector.render();

      dialog.merge_table = selector;
      dialog.model.set("merge_flavor", "regular");

      var queryResult = "SELECT CASE WHEN a.the_geom IS NULL THEN b.the_geom ELSE a.the_geom END AS the_geom, a.field_a, a.field_b, a.field_c, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";

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

      var queryResult = "SELECT a.field_a, a.field_b, a.field_c, b.field_d, b.field_e, CASE WHEN b.the_geom IS NULL THEN a.the_geom ELSE b.the_geom END AS the_geom FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";

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

      var queryResult = "SELECT a.field_a, a.field_b, a.field_c, CASE WHEN a.the_geom IS NULL THEN b.the_geom ELSE a.the_geom END AS the_geom, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";
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

      var queryResult = "SELECT b.field_d, b.field_e, CASE WHEN b.the_geom IS NULL THEN a.the_geom ELSE b.the_geom END AS the_geom FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";
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

      var queryResult = "SELECT CASE WHEN a.the_geom IS NULL THEN b.the_geom ELSE a.the_geom END AS the_geom, a.field_a, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON a.field_a = b.field_d";

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
        ['field_c',   'string']
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

      dialog = new MergeDatasetsView({
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

      var queryResult = "SELECT CASE WHEN a.the_geom IS NULL THEN b.the_geom ELSE a.the_geom END AS the_geom, a.field_a, b.field_d, b.field_e FROM a FULL OUTER JOIN b ON LOWER(TRIM(a.field_a)) = LOWER(TRIM(b.field_d))";

      expect(query).toEqual(queryResult);
    });

    it("should open the dialog", function() {
      dialog.render();
      expect(dialog.$el.length > 0).toEqual(true);
    });

    it("should have two selector tables", function() {
      dialog.render();

      expect(dialog.actual_table).toBeDefined();
      expect(dialog.merge_table).toBeDefined();
    });

    it("should have an input", function() {
      dialog.render();

      expect(dialog._$input()).toBeDefined();
      expect(dialog._$input().length > 0).toBeTruthy();
    });

    it("should have a next button", function() {
      dialog.render();

      expect(dialog._$next()[0]).toBeDefined();
      expect(dialog._$nextText()[0]).toBeDefined();
      expect(dialog._$nextText().text()).toEqual('Next step');
    });

    it("should have a list of merge options", function() {
      dialog.render();

      expect(dialog._$mergeFlavorList()).toBeDefined();
      expect(dialog._$mergeFlavorList().length > 0).toBeTruthy();
    });

    it("should have a table selector", function() {
      dialog.render();

      expect(dialog._$tableSelector()).toBeDefined();
      expect(dialog._$tableSelector().length > 0).toBeTruthy();
    });

    it("should have a table name form", function() {
      dialog.render();

      expect(dialog._$tableNameForm()).toBeDefined();
      expect(dialog._$tableNameForm().length > 0).toBeTruthy();
    });

    it("next button should be disabled on the begining", function() {
      dialog.render();
      expect(dialog._$next().hasClass('is-disabled')).toBeTruthy();
    });

    it("should increase the state value when clicking the enabled next button", function() {
      dialog.render();
      dialog.model.set("enableNext", true);

      dialog._$next().click();

      expect(dialog.model.get("state")).toEqual(1);
    });

    it("shouldn't increase the state value when clicking the disabled next button", function() {
      dialog.render();

      dialog.model.set("enableNext", false);
      dialog._$next().click();

      expect(dialog.model.get("state")).toEqual(0);
    });

    it("should disable the next button when the user clicks in the next button", function() {
      dialog.render();

      dialog.model.set("enableNext", true);
      dialog.model.set("merge_flavor", "regular");

      dialog._$next().click();

      expect(dialog.model.get("enableNext")).toEqual(false);
    });

    it("should allow to enable/disable the next button", function() {
      dialog.render();

      dialog.model.set("enableNext", true);
      expect(dialog._$next().hasClass("is-disabled")).toBeFalsy();

      dialog.model.set("enableNext", false);
      expect(dialog._$next().hasClass("is-disabled")).toBeTruthy();
    });

    it("should allow to change the text of the next button", function() {
      jasmine.clock().install();
      dialog.render();

      var text = "Okok";

      dialog.model.set("nextButtonText", text);

      jasmine.clock().tick(500);
      expect(dialog._$nextText().text()).toEqual(text);
      jasmine.clock().uninstall();
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

    it("should enable the next button when the user selects a destination table", function(done) {
      dialog.render();

      dialog.$el.find(".radiobutton[data-merge-flavor='regular']").click();
      dialog.$el.find(".next").click();

      dialog.merge_table.$el.find("select option:last-child").attr("value");
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
      expect(dialog.$("*[data-merge-flavor='regular']").parent().hasClass("is-disabled")).toEqual(false);
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
