
    
    $(document).ready(function(){
      $("table#cDBtable").cDBtable(
        'start',{
          getDataUrl: '/api/json/table/'+table_id,  
          paginateParam: "rows_per_page",
          resultsPerPage: 50,
          reuseResults: 100,
          total: 5000
        }
      );
    });
