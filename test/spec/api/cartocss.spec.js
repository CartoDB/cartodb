fdescribe("cartocss generators", function(){
	beforeAll(function(){
		this.query = 'SELECT * FROM testable';
	})

	it("should return a torque style for date cols", function(){
		var stats = JSON.parse('{"type":"date","start_time":"2015-02-19T15:13:16.000Z","end_time":"2015-02-22T04:34:05.000Z","range":220849000,"steps":1024,"null_ratio":0,"column":"object_postedtime"}');
		var col = new Backbone.Model(JSON.parse('{"name":"object_postedtime","type":"date","geometry_type":"point","bbox":[[-28.92163128242129,-201.09375],[75.84516854027044,196.875]],"analyzed":true,"success":true,"stats":{"type":"date","start_time":"2015-02-19T15:13:16.000Z","end_time":"2015-02-22T04:34:05.000Z","range":220849000,"steps":1024,"null_ratio":0,"column":"object_postedtime"}}'));
		// expect(JSON.stringify(cartodb.CartoCSS.guessMap)).toEqual("");
		expect(cdb.CartoCSS.guessMap(this.query, "testable", col, stats)).not.toEqual(-1);
	});

	it("should return bubble for point, number columns", function(){
		
	});

	it("should return choropleth for non-point number columns", function(){
		
	});

	it("should return category for strings", function(){
		
	});

	it("should return category for boolean", function(){
		
	});
})