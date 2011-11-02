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
				console.log(state);
				if (state!="/table" && state!="/map") {
					$.History.go('/table');					
				}
	    });

		
			// Init cartoDB table
			$("table#carto_table").cartoDBtable(
			  'start',
  			{
          getDataUrl: global_api_url + 'tables/',
          resultsPerPage: 20,
          reuseResults: 100,
          total: 5000,
          query: "SELECT * FROM "+ table_name,
          order_by: 'cartodb_id',
          mode: 'asc',
          enabled: false
        }
      );
		
		
		
		  // Check if it's necessary start table or not!
			var hash = window.location.hash;
			
			if (hash == "#/map") {
				$('body').attr('view_mode','map');
			} else if (hash == "#/map") {
				$('body').attr('view_mode','table');
			} else {
				$.History.go('/table');
				$('body').attr('view_mode','table');
			}
			
			// Setup mode of app
			$('body').attr('query_mode','false');

		}
		