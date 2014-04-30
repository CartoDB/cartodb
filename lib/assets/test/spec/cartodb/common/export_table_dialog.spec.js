describe('ExportTableDialog', function() {
  var view;
  beforeEach(function() {
    window.user_name = 'testglobal'
    view = new cdb.admin.ExportTableDialog({
      model: TestUtil.createTable(),
      api_key: 'testapikey',
      config: {
        user_name: 'test',
        sql_api_domain: 'test.com',
        sql_api_port: 1234,
        sql_api_protocol: 'http'
      }
    });
  });

  it("should contain username in export url", function() {
    view.dataGeoreferenced = true;
    view.render();
    var url = view.$('form').attr('action');
    expect(url).toEqual('http://test.test.com:1234/api/v1/sql');
  });

  it("should include api key if provided", function() {
    view.render();
    spyOn(view, '_fetchGET');
    view._fetch({ format: 'csv', api_key: 'testapikey', filename: 'test' }, 'select * from table');
    expect(view._fetchGET).toHaveBeenCalled();
    expect(view._fetchGET.calls.argsFor(0)[0].indexOf("api_key=testapikey") !== -1).toEqual(true);
  });

});
