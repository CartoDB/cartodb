    var requests_queue;
    var geolocating = false;

    
    head.ready(function(){
      head.js(
        "/javascripts/admin/maps/map.js",
        "/javascripts/admin/maps/map_elements.js",
        "/javascripts/admin/maps/header_elements.js",
        // "/javascripts/admin/maps/map_functions.js",
        // "/javascripts/admin/maps/style_functions.js",
        // "/javascripts/admin/maps/map_functions.js",
        // "/javascripts/admin/maps/CartoMarker.js",
        // "/javascripts/admin/maps/CartoInfowindow.js",
        "http://maps.google.com/maps/api/js?sensor=true&callback=initMap");
        
        $("table#carto_table").cDBtable(
          'start',{
            getDataUrl: '/v1/tables/',
            resultsPerPage: 20,
            reuseResults: 600,
            total: 5000,
            query: "SELECT * FROM "+ table_name,
            order_by: 'cartodb_id',
            mode: 'asc'
          }
        );
        
        requests_queue = new loaderQueue();
    });