    var requests_queue;


    head.ready(function(){
			// Inits loader queue
			requests_queue = new loaderQueue();
			
			// Init the map
			initMap();

			// Manage tabs with url hash
			manageHash();
    });



		function manageHash() {
			var table_enabled = true,
					document_title = document.title;


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
	
			
			// IF there is no hash -> /table
			if (window.location.hash == "") {
				$.History.go('/table');	
			}
		
			// Init cartoDB table
			$("table#carto_table").cartoDBtable(
			  'start',
  			{
          getDataUrl: global_api_url + 'tables/',
          resultsPerPage: 40,
          reuseResults: 120,
          total: 5000,
          query: "SELECT * FROM "+ table_name,
          order_by: 'cartodb_id',
          mode: 'asc',
          enabled: false
        }
      );
		}
		