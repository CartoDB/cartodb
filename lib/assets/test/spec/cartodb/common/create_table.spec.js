describe("Create table dialog", function() {
  var dialog, table, vis, vis2;

  afterEach(function() {
    dialog.clean();
  });

  beforeEach(function() {

    // Create a new dialog
    dialog = new cdb.admin.CreateTableDialog({
      tables : new cdb.admin.Tables(),
      files: null,
      url: null,
      quota: 0
    });

  });

  it("should allow to use FTP URIs", function() {
    $("body").append(dialog.render().el);

    var url  = "ftp://ftp2.census.gov/geo/tiger/TIGER2011/TRACT/tl_2011_08_tract.zip";

    result = dialog._checkURL(url);

    expect(result).toEqual(true);

  });

});
