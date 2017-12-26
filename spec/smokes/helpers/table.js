/* Table utilities using the table endpoint */

module.exports = {

	removeAllTables: function(api_key) {
		this.api_key = api_key || configuration.API_KEY;
		var url     = configuration.BASE_URL + '/api/v1/tables';
		var headers = {
			'Host'        : configuration.HOST,
			'Accept'      : 'application/json'
		};

		casper.thenOpen(tools.auth(url)).then(function() {
			response = JSON.parse(casper.getPageContent());
			for (table in response.tables) {
				var table_id = response.tables[table]["id"];
				var url     = configuration.BASE_URL + '/api/v1/tables/' + table_id;
				casper.log("Removing table "+table_id);
				casper.thenOpen(tools.auth(url), { 
						method:   'delete',
						data:     JSON.stringify(payload),
						headers:  headers
					});
			};
		})
	},


	Table: function(tableName, api_key) {
  	//Creates a random table name with the timestamp
  	this.tableName = tableName || "test" + Date.now();
  	this.api_key = api_key || configuration.API_KEY;
  	

  	this.create = function() {
  		var payload = { name: this.tableName };
  		var url     = configuration.BASE_URL + '/api/v1/tables';
  		var headers = {
  			'Host'        : configuration.HOST,
  			'Content-Type': 'application/json',
  			'Accept'      : 'application/json'
  		}
  		casper.thenOpen(tools.auth(url), { 
  			method:   'post',
  			data:     JSON.stringify(payload),
  			headers:  headers
  		})

  		casper.then(function() {
				response = JSON.parse(casper.getPageContent());
  		})
  	}

  	return this;
  }
}

