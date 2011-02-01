

    $(document).ready(function(){
      $("table#cDBtable").cDBtable(
        'start',{
          getDataUrl: '/api/json/tables/'+table_id,
          resultsPerPage: 50,
          reuseResults: 100,
          total: 5000
        }
      );
      $('p.session a, a.logo').click(function(){window.location.href = $(this).attr('href');});
    });

    
    
    
