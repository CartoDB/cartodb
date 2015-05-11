describe('ExportTableDialog', function() {
  var view;
  beforeEach(function() {
    //cdb.config.set('sql_api_template', 'http://{user}.test.com:1234/api/v1/sql')
    //cdb.config.set('user_name', 'test')
    view = new cdb.admin.ExportTableDialog({
      model: TestUtil.createTable(),
      api_key: 'testapikey'
    });
  });


  it("should contain username in export url", function() {
    view.dataGeoreferenced = true;
    view.render();
    var url = view.$('form').attr('action');
    expect(url).toEqual('http://test.localhost.lan/api/v2/sql');
  });

  it("should include api key if provided", function() {
    view.render();
    spyOn(view, '_fetchGET');
    view._fetch({ format: 'csv', api_key: 'testapikey', filename: 'test' }, 'select * from table');
    expect(view._fetchGET).toHaveBeenCalled();
    expect(view._fetchGET.calls.argsFor(0)[0].indexOf("api_key=testapikey") !== -1).toEqual(true);
  });

});
