
    $(document).ready(function(){
      
      //Put paginator in middle
      var paginator_width = $('div.paginate').width();
      $('div.paginate').css('margin-left', ((626-paginator_width)/2) +'px');
      $('div.paginate').show();
      
      //Hover over last item of list
      $('ul.your_tables li.last').hover(function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 -11px');
      }, function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 0');
      });
      
      
      $('a.new_table').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeIn();
        $.ajax({
          method: "POST",
          url: '/api/json/tables/',
          success: function(data) {
            console.debug(data);
          },
          error: function(e) {
            console.debug(e);
          }
        });
      });
    });