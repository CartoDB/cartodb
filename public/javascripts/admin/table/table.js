    var requests_queue = new loaderQueue();
    var geolocating = false;


    head(function(){
      initMap();
      
      $("table#carto_table").cDBtable(
        'start',{
          getDataUrl: '/v1/tables/' + table_name, //-query +table_id
          resultsPerPage: 20,
          reuseResults: 600,
          total: 5000,
          query: "SELECT * FROM "+ table_name
        }
      );
    });