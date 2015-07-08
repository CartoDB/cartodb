var $ = require('jquery');
var PecanView = require('../../../../../../javascripts/cartodb/common/dialogs/pecan/pecan_view');

fdescribe('common/dialog/pecan/pecan_view', function() {
	beforeEach(function() {
    this.map = new cdb.admin.Map();
    this.table = new cdb.admin.CartoDBTableMetadata();
    window.user_data = {username: "manolo"}
    this.view = new PecanView({table: this.table, map: this.map});
  });
  it("wololo", function(){
  	expect("trrrrr");
  })
});