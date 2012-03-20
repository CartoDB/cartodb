
    head.ready(function(){

			// Init the view
			initView();

			// Init the map
			initMap();

			// IF there is no hash -> /table
			var table_enabled = false;
			if (window.location.hash == "") {
				table_enabled = !table_enabled;
			}

			// Init the table
			$("table#carto_table").cartoDBtable(
			  'start', {
          getDataUrl: global_api_url + 'sql/',
          resultsPerPage: 40,
          reuseResults: 120,
          total: 5000,
          query: "SELECT * FROM "+ table_name,
          order_by: 'cartodb_id',
          mode: 'asc',
          enabled: table_enabled,
          schema: table_schema
        }
      );

      // Manage tabs with url hash
			manageHash();
    });



		function manageHash() {
	    // Bind a handler for state: map
	    $.History.bind('/map',function(state) {
				goToMap();
	    });

	    // Bind a handler for state: table
	    $.History.bind('/table',function(state){
				goToTable();
	    });

			// Bind a handler for any other state
			$.History.bind(function(state){
				if (state!="/table" && state!="/map") {
					$.History.go('/table');
				}
	    });
		}