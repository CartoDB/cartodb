
describe('cdb.admin.models.Filter', function() {

  var model, table, hist, bounds;

  beforeEach(function() {
    hist = [];
    bounds = {}

    bounds.upper = 10;
    bounds.lower = 3;
    for(var i = 0; i < 10; ++i) {
      hist.push(i);
    }
    table = TestUtil.createTable('test');
    sinon.stub(table.data(), 'histogram').yields(hist, bounds);
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


});

describe('cdb.admin.models.FilterDiscrete', function() {
  var model, table, hist;

  beforeEach(function() {
    hist = [
      {bucket: 'test1', value: 20},
      {bucket: 'test2', value: 30}
    ];
    table = TestUtil.createTable('test');
    sinon.stub(table.data(), 'discreteHistogram').yields(hist);
    model = new cdb.admin.models.FilterDiscrete({
      table: table,
      column: 'c'
    });
  });

  it("should return sql condition", function() {
    var sql = model.getSQLCondition();
    expect(sql).toEqual(" (c IN ('test1','test2')) ");
  });

  it("should return sql condition with selected only", function() {
    model.items.models[0].set('selected', false);
    var sql = model.getSQLCondition();
    expect(sql).toEqual(" (c IN ('test2')) ");
  });
});
