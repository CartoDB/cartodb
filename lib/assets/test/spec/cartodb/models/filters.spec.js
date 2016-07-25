describe('modules.Filters', function() {

  //===================================================
  // Filters
  //===================================================
  describe('cdb.admin.models.Filters', function() {

    var filters, table, dataLayer;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      dataLayer = new cdb.core.Model({ sql_or_toggle: false});
      filters = new cdb.admin.models.Filters(null, {
        table: table,
        dataLayer: dataLayer
      });
    });

    it("should generate correct model for column type", function() {
      filters.reset([{
        'column_type': 'number',
        'column': 'test'
      }, {
        'column_type': 'string',
        'column': 'teststr'
      }]);

      expect(filters.models[0] instanceof cdb.admin.models.Filter).toEqual(true);
      expect(filters.models[1] instanceof cdb.admin.models.FilterDiscrete).toEqual(true);

    });
  });

  //===================================================
  // Filter
  //===================================================
  describe('cdb.admin.models.Filter (numeric)', function() {

    var model, table, hist, bounds;

    beforeEach(function() {
      hist = [];
      bounds = {}

      bounds.upper = 10;
      bounds.lower = 3;
      bounds.bucket_size = 1
      for(var i = 0; i < 10; ++i) {
        hist.push(i);
      }
      table = TestUtil.createTable('test');

      spyOn(table.data(), 'histogram').and.callFake(function(a, b, callback){
        callback(hist, _.clone(bounds));
      })

      model = new cdb.admin.models.Filter({
        table: table,
        column_type: "number",
        column: 'c'
      });

    });

    it("should have a table", function() {
      expect(model.table).toEqual(table);
      expect(model.get('table')).toEqual(undefined);
    });

    it("should set bounds", function() {
      expect(model.get('lower')).toEqual(3);
      expect(model.get('upper')).toEqual(10);
    });

    it("should return the condition", function() {
      expect(model.getSQLCondition()).toEqual(" (c >= 3 AND c <= 10) ");
    });

    it("should fecth data when the table is saved", function() {
      spyOn(model, '_fetchHist');
      table.trigger('data:saved');
      expect(model._fetchHist).toHaveBeenCalled();
    });

    it("should adjust the bounds", function() {
      model.set({
        bounds: {
          lower: 2,
          upper: 10
        },
        lower: 3,
        upper: 9
      })
      table.trigger('data:saved');
      expect(model.get('lower')).toEqual(3);
      expect(model.get('upper')).toEqual(9);

      // Bounds have been expanded on the lower and upper side
      bounds.lower = 1;
      bounds.upper = 11;
      table.trigger('data:saved');
      expect(model.get('lower')).toEqual(1);
      expect(model.get('upper')).toEqual(11);
    });

    it("should raise an error when histogram can't be generated", function() {
      spy = sinon.spy()
      model.bind('error', spy);
      table.data().histogram.and.callFake(function(a, b, callback){
        callback(null, null);
      });
      table.trigger('data:saved');
      expect(spy.called).toEqual(true);
    });

    it("should serialize to json", function() {
      expect(model.toJSON()).toEqual({
        column: 'c',
        upper: 10,
        tz: undefined,
        lower: 3,
        column_type: 'number'
      });
    });

  });

  describe('cdb.admin.models.Filter (date)', function() {

    var model, table, hist, bounds;

    beforeEach(function() {
      hist = [];
      bounds = {}

      bounds.lower = 360000000; // Mon Jan 31 1994 08:06:40 GMT+0100 (CET)
      bounds.upper = 760000000; // Fri May 29 1981 18:00:00 GMT+0200 (CEST)

      bounds.bucket_size = 1

      for (var i = 0; i < 10; ++i) {
        hist.push(bounds.upper + i*10000);
      };

      table = TestUtil.createTable('test');

      spyOn(table.data(), 'date_histogram').and.callFake(function(a, b, callback){
        callback(hist, _.clone(bounds));
      })

      model = new cdb.admin.models.Filter({
        table: table,
        column_type: "date",
        column: 'c',
        bounds: bounds,
        lower: bounds.lower * 1000,
        upper: bounds.upper * 1000,
        lower_limit: bounds.lower * 1000,
        upper_limit: bounds.upper * 1000,
        tz: "1981-05-29T18:00:00+0000"
      });

    });

    it("should have a table", function() {
      expect(model.table).toEqual(table);
      expect(model.get('table')).toEqual(undefined);
    });

    it("should return the condition", function() {

      var lower = moment(360000000000).format("YYYY-MM-DDTHH:mm:ssZ").toString();
      var upper = moment(760000000000).format("YYYY-MM-DDTHH:mm:ssZ").toString();
      // Tests the selection of the full range
      expect(model.getSQLCondition()).toEqual(" (c >= ('"+ lower+ "') AND c <= ('"+ upper +"')) ");

      // Tests the selection of a small range
      upper = moment(bounds.upper - 61*1000).format("YYYY-MM-DDTHH:mm:ssZ").toString();
      model.set("upper_limit", bounds.upper - 61*1000);
      expect(model.getSQLCondition()).toEqual(" (c >= ('"+ lower+ "') AND c <= ('"+ upper +"')) ");
    });

    it("should transform a timestamp to a date", function() {
      var timestamp = 361670400000;
      var date = model._getDateFromTimestamp(timestamp);

      expect(date.toString()).toEqual(new Date(timestamp).toString());
    });

    it("should adjust the bounds", function() {
      model.set({
        bounds: {
          lower: 360000000,
          upper: 760000000
        },
        lower: 400000000000,
        upper: 700000000000
      })
      table.trigger('data:saved');
      expect(model.get('lower')).toEqual(400000000000);
      expect(model.get('upper')).toEqual(700000000000);

      // Bounds have been expanded on the lower and upper side
      bounds.lower = 300000000;
      bounds.upper = 800000000;
      table.trigger('data:saved');
      expect(model.get('lower')).toEqual(300000000000);
      expect(model.get('upper')).toEqual(800000000000);
    });

  });

  describe('FilterDiscrete (boolean)', function() {
    var model_true, model, model_true_null, model_true_false_null, table, hist, stub;

    beforeEach(function() {

      // Creates a stub table with the specified rows and returns the associated model
      function generateModel(rows) {

        hist = { };

        hist.rows = rows;

        table = TestUtil.createTable('test');
        stub  = sinon.stub(table.data(), 'discreteHistogram')

        stub.yields(hist);

        return new cdb.admin.models.FilterDiscrete({
          table: table,
          column: 'c',
          column_type: 'boolean'
        });
      }

      // Model for true and false values
      var rows = [
        { bucket: false, value: 100 },
        { bucket: true, value: 200 }
      ];

      model = generateModel(rows);

      // Model for true values
      rows = [
        { bucket: true, value: 200 }
      ];

      model_true = generateModel(rows);

      // Model for true and null values
      rows = [
        { bucket: null, value: 100 },
        { bucket: true, value: 200 }
      ];

      model_true_null = generateModel(rows);

      // Model for true, false and null values
      rows = [
        { bucket: null, value: 100 },
        { bucket: true, value: 200 },
        { bucket: false, value: 20 }
      ];

      model_true_false_null = generateModel(rows);

    });

    it("should return a valid SQL in boolean mode for true and false values", function() {
      model.set({ list_view : true });
      var sql = model.getSQLCondition();
      expect(sql).toEqual("c IN (false,true) ");
    });

    it("should return a valid SQL in boolean mode for true values", function() {
      model_true.set({ list_view : true });
      var sql = model_true.getSQLCondition();
      expect(sql).toEqual("c IN (true) ");
    });

    it("should return a valid SQL in boolean mode for true and null values ", function() {
      model_true_null.set({ list_view : true });
      var sql = model_true_null.getSQLCondition();
      expect(sql).toEqual("c IN (true) OR c IS NULL ");
    });

    it("should return a valid SQL in boolean mode for true, false and null values ", function() {
      model_true_false_null.set({ list_view : true });
      var sql = model_true_false_null.getSQLCondition();
      expect(sql).toEqual("c IN (true,false) OR c IS NULL ");
    });

  });


  describe('FilterDiscrete (null)', function() {
    var model, table, hist, stub;

    beforeEach(function() {

      hist = { };

      hist.rows = [
        { bucket: 'test1' },
        { bucket: null },
        { bucket: 'test3' }
      ];

      table = TestUtil.createTable('test');
      stub  = sinon.stub(table.data(), 'discreteHistogram')

      stub.yields(hist);

      model = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'd',
        items: [{
          bucket: 'test1',
          selected: true
        }, {
          bucket: null,
          selected: true
        }, {
          bucket: 'test3',
          selected: false
        }]
      });

    });

    it("should handle the null buckets", function() {
      var sql = model.getSQLCondition();
      expect(sql).toEqual("d IN ('test1','null') OR d IS NULL ");
    });

  });

  describe('FilterDiscrete', function() {
    var model, model2, model3, table, hist, stub;

    beforeEach(function() {

      hist = { };

      hist.rows = [
        { bucket: 'test1' },
        { bucket: 'test2' },
        { bucket: 'test3' }
      ];

      table = TestUtil.createTable('test');
      stub  = sinon.stub(table.data(), 'discreteHistogram')

      stub.yields(hist);

      model = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'c',
        items: [{
          bucket: 'test1',
          selected: true
        }, {
          bucket: 'test2',
          selected: true
        }, {
          bucket: 'test3',
          selected: false
        }],
        operations: [{
            operation: 'CONTAINS',
            operator: 'OR',
            text: 'test1'
        }]
      });

      model2 = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'c',
        items: [{
          bucket: 'test1',
          selected: true
        }, {
          bucket: 'test2',
          selected: true
        }, {
          bucket: 'test3',
          selected: true
        }],
        operations: []
      });

      model3 = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'c',
        list_view: false,
        items: [ ],
        operations: []
      });

    });

    it("should return a 'partial' SQL condition when some of the items are selected", function() {
      var sql = model.getSQLCondition();
      expect(sql).toEqual("c IN ('test1','test2') ");
    });

    it("should return a full SQL condition when all the items are selected", function() {
      sql = model2.getSQLCondition();
      expect(sql).toEqual(" (true) ");

    });

    it("shouldn't return an operations query in list_view mode", function() {
      model.set({ list_view : true });

      var sql = model.getSQLCondition();
      expect(model.get("column")).toEqual("c");
      expect(sql).toEqual("c IN ('test1','test2') ");
    });

    it("should return a valid SQL when operations is empty", function() {
      var sql = model3.getSQLCondition();
      expect(sql).toEqual(" (true) ");
    });

    it("should return sql condition with selected only", function() {
      model.items.models[0].set('selected', false);
      var sql = model.getSQLCondition();
      expect(sql).toEqual("c IN ('test2') ");
    });

    it("should raise an error when histogram can't be generated", function() {
      spy = sinon.spy()
      model.bind('error', spy);
      stub.yields(null);
      table.trigger('data:saved');
      expect(spy.called).toEqual(true);
    });

    it("should keep selected values", function() {
      model = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'c',
        items: [{
          bucket: 'test',
          selected: false
        }],
        operations: []
      });

      hist = {};
      hist.rows = [
        {bucket: 'test'},
      ];

      stub.yields(hist);
      table.trigger('data:saved');
      expect(model.items.where({ bucket: 'test'})[0].get('selected')).toEqual(true)

    });

    it("should serialize to json", function() {
      expect(model.toJSON()).toEqual({
        reached_limit: undefined,
        column: 'c',
        items: [
          { bucket: 'test1', selected: true },
          { bucket: 'test2', selected: true },
          { bucket: 'test3', selected: false }
        ],
        operations: [
          { operation: 'CONTAINS', operator: 'OR', text: 'test1' }
        ],
        column_type : undefined,
        list_view : true
      });
    });

  });

  describe('FilterDiscrete: null', function() {
    var model, table, hist, stub;

    beforeEach(function() {

      hist = { };

      hist.rows = [
        { bucket: 'test1'},
        { bucket: 'test2'},
        { bucket: 'test3'},
        { bucket: null }
      ];

      table = TestUtil.createTable('test');
      stub  = sinon.stub(table.data(), 'discreteHistogram')

      stub.yields(hist);

      model = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'c',
        items: [{
          bucket: 'test1',
          selected: true
        }, {
          bucket: 'test2',
          selected: true
        }, {
          bucket: 'test3',
          selected: false
        }, {
          bucket: null,
          selected: false
        }]
      });

    });

    it("shouldn't select the NULL value in the query it'is unchecked", function() {
      var sql = model.getSQLCondition();
      expect(model.get("column")).toEqual("c");
      expect(sql).toEqual("c IN ('test1','test2') AND c IS NOT NULL ");
    });

  });

});

