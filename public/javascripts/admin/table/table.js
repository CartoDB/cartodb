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
		  var table_enabled = true;
		  
			var hash = window.location.hash;
			if (hash == "#map") {
				$('section.subheader ul.tab_menu li a:contains("Map")').click();
				$('body').attr('view_mode','map');
				table_enabled = false;
			} else {
				$('body').attr('view_mode','table');
				window.location.hash = "#table";
			}

      // Setup mode of app
			$('body').attr('query_mode','false');
			
			
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
          enabled: table_enabled
        }
      );
		}
		