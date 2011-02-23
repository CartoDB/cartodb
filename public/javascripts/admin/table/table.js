    var requests_queue = new loaderQueue();
    var geolocating = false;


    $(document).ready(function(){
      $("table#cDBtable").cDBtable(
        'start',{
          getDataUrl: '/api/json/tables/'+table_id,
          resultsPerPage: 50,
          reuseResults: 100,
          total: 5000
        }
      );
    });

    
    
    
    
    
    
    
