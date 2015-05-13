describe("ImportGDrivePane", function() {

  var view;

  beforeEach(function() {
    view = new cdb.admin.ImportGdrivePane();
  });

  afterEach(function() {
    view.clean();
  })

  // it("should contain a label with the valid file extensions", function() {
  //   expect(view.$('label').length).toBe(1);
  //   expect(view.$('label').text()).toBe("(Google spreadsheet)");
  //   expect(view.$('p.filename').length).toBe(1);
  //   expect(view.$('.gdrive-chooser').length).toBe(1);
  // });

  // No longer available

});