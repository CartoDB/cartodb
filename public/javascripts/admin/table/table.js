    var requests_queue;
    var geolocating = false;
	  
    
    head.ready(function(){
			if (map_enabled) {
				head.js(
	        "/javascripts/admin/maps/map.js",
	        "/javascripts/admin/maps/map_elements.js",
	        "/javascripts/admin/maps/CartoMap.js",
	        "http://maps.google.com/maps/api/js?sensor=true&callback=initApp"
				);
			} else {
				initApp();
			}
    });


		function initApp() {
			// Inits loader queue
			requests_queue = new loaderQueue();
			
			// Inits map if map_enabled = true
			if (map_enabled) initMap();
			
			// Inits carto table
			$("table#carto_table").cDBtable(
        'start',{
          getDataUrl: global_api_url + 'tables/',
          resultsPerPage: 20,
          reuseResults: 100,
          total: 5000,
          query: "SELECT * FROM "+ table_name,
          order_by: 'cartodb_id',
          mode: 'asc'
        }
      );

			// Manage tabs with url hash
			manageHash();
		}
		
		
		function manageHash() {
			if (map_enabled) {
				var hash = window.location.hash;
				if (hash == "#map") {
					$('section.subheader ul.tab_menu li a:contains("Map")').click();
					setTimeout(function(){$('body').trigger('enabled',[false])},500);
					$('body').attr('view_mode','map');
				} else {
					$('body').attr('view_mode','table');
					window.location.hash = "#table";
				}
			} else {
				$('body').attr('view_mode','table');
				window.location.hash = "#table";
			}
			$('body').attr('query_mode','false');
		}