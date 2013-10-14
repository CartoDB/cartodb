describe("ImportFilePane", function() {

  var view;

  beforeEach(function() {
    view = new cdb.admin.ImportFilePane();
  });

  it("should render properly", function() {
    expect(view.$('input.url-input').length).toBe(1);
    expect(view.$('.fileinput-button span').text()).toBe('select a file')
    expect(view.import_info).toBeDefined();
  });

  it("should contain a label with the valid file extensions and a link", function() {
    expect(view.$('label').length).toBe(1);
    expect(view.$('label a').attr('href')).toBe("http://developers.cartodb.com/documentation/using-cartodb.html#formats_accepted");
  });

  it("should remove 'select a file' button if user types a url", function() {
    spyOn(view, '_hideUploader');
    view.$('input.url-input').val('jam');
    view._onInputChange();
    expect(view._hideUploader).toHaveBeenCalled();
  });

  it("should show error module if user submit the form with a non valid url", function() {
    spyOn(view.import_info, 'activeTab');
    view.$('input.url-input').val('jam');
    view._onInputChange();
    view.submitUpload();
    expect(view.import_info.activeTab).toHaveBeenCalledWith('error', view._TEXTS.urlError);
  });

  it("should send pane model attributes when file/url added is correct", function() {
    spyOn(view, '_send');
    view.$('input.url-input').val('http://cartodb.com/paco.csv');
    view._onInputChange();
    view.submitUpload();
    expect(view._send).toHaveBeenCalled();
  });

});
