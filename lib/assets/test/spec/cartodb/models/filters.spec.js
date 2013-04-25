describe('modules.Filters', function() {

  //===================================================
  // Filters
  //===================================================
  describe('cdb.admin.models.Filters', function() {

    var filters, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      filters = new cdb.admin.models.Filters(null, {
        table: table
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
  describe('cdb.admin.models.Filter', function() {

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
      stub = sinon.stub(table.data(), 'histogram')
      stub.yields(hist, bounds);
      model = new cdb.admin.models.Filter({
        table: table,
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
      bounds.lower = 4;
      bounds.upper = 9;
      table.trigger('data:saved');
      expect(model.get('lower')).toEqual(4);
      expect(model.get('upper')).toEqual(9);

      bounds.lower = 1;
      bounds.upper = 12;
      table.trigger('data:saved');
      expect(model.get('lower')).toEqual(4);
      expect(model.get('upper')).toEqual(9);

    });

    it("should raise an error when histogram can't be generated", function() {
      spy = sinon.spy()
      model.bind('error', spy);
      stub.yields(null, null);
      table.trigger('data:saved');
      expect(spy.called).toEqual(true);
    });

    it("should serialize to json", function() {
      expect(model.toJSON()).toEqual({
        column: 'c',
        upper: 10,
        lower: 3
      });
    });


  });

  describe('FilterDiscrete', function() {
    var model, table, hist, stub;

    beforeEach(function() {

      hist = { };

      hist.rows = [
        { bucket: 'test1', value: 20 },
        { bucket: 'test2', value: 30 }
      ];

      table = TestUtil.createTable('test');
      stub  = sinon.stub(table.data(), 'discreteHistogram')

      stub.yields(hist);

      model = new cdb.admin.models.FilterDiscrete({
        table: table,
        column: 'c'
      });

    });

    it("should return sql condition", function() {
      var sql = model.getSQLCondition();
      expect(sql).toEqual("(COALESCE(c, 'null') IN ('test1','test2')) ");
    });

    it("should return sql with free_text", function() {
      model.set("free_text", "Valladolid");
      var sql = model.getSQLCondition();
      expect(sql).toEqual("c ILIKE '%Valladolid%' ");
    });

    it("should return a valid sql when free_text is empty", function() {
      model.set("free_text", "");
      var sql = model.getSQLCondition();
      expect(sql).toEqual("(COALESCE(c, 'null') IN ('test1','test2')) ");
    });

    it("should return sql condition with selected only", function() {
      model.items.models[0].set('selected', false);
      var sql = model.getSQLCondition();
      expect(sql).toEqual("(COALESCE(c, 'null') IN ('test2')) ");
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
          value: 1,
          selected: false
        }]
      });

      hist = {};
      hist.rows = [
        {bucket: 'test', value: 20},
      ];

      stub.yields(hist);
      table.trigger('data:saved');
      expect(model.items.where({ bucket: 'test'})[0].get('selected')).toEqual(true)

    });
    it("should serialize to json", function() {
      expect(model.toJSON()).toEqual({
        column: 'c',
        items: [
          { bucket: 'test1', value: 20, selected: true },
          { bucket: 'test2', value: 30, selected: true }
        ]
      });
    });
  });
});

