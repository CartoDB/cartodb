var $ = require('jquery');
var PecanView = require('../../../../../../javascripts/cartodb/common/dialogs/pecan/pecan_view');

describe('common/dialog/pecan/pecan_view', function() {
	beforeEach(function() {
    this.map = new cdb.admin.Map();
    this.table = new cdb.admin.CartoDBTableMetadata();
    window.user_data = {username: "manolo"}
    this.view = new PecanView({table: this.table, map: this.map});
  });
  describe('date columns', function(){
  	beforeEach(function() {
  		var self = this;
  		this.originalExecute = cdb.admin.SQL.prototype.execute;
  		// Mocked response for a date column
  		cdb.SQL.prototype.execute = function(sql, vars, options, callback){
  			if(sql.indexOf("limit 0") > -1){
  				vars(sql, vars, options, callback);
  			}
  			else{
	  			var fakeResponse = '{"rows":[{"start_time":"2014-02-24T16:50:50+0100","end_time":"2015-04-18T15:18:15+0200","moments":299}],"time":0.44,"fields":{"start_time":{"type":"date"},"end_time":{"type":"date"},"moments":{"type":"number"}},"total_rows":1}';
	  			if(typeof vars === 'function') callback = vars;
	  			callback(JSON.parse(fakeResponse));
  			}
  		}
  	});

  	fit("date columns should be analyzed", function(done){
  		//spyOn(cdb.admin.SQL, "describe")
  		var dateColumn = new cdb.core.Model({ name: "postedtime", type: "date", geometry_type: undefined, bbox: undefined, analyzed: false });
	  	this.view._analyzeColumn(dateColumn);
	  	expect(true === false);
	  })
  })
});