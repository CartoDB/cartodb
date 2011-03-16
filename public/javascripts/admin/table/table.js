    var requests_queue = new loaderQueue();
    var geolocating = false;


    head(function(){
      
      head.js("http://maps.google.com/maps/api/js?sensor=false&callback=initMap");
      
      $("table#carto_table").cDBtable(
        'start',{
          getDataUrl: '/v1/tables/' + table_name, //-query +table_id
          resultsPerPage: 50,
          reuseResults: 100,
          total: 5000,
          query: "SELECT cartodb_id,address,created_at FROM "+ table_name
        }
      );
    });