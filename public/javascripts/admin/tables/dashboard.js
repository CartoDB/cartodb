

    $(document).ready(function(){

      //Put paginator in middle
      var paginator_width = $('div.paginate').width();
      $('div.paginate').css('margin-left', ((626-paginator_width)/2) +'px');
      $('div.paginate').show();

      $('a.close').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.requests_info').fadeOut();
      });

      $('ul.your_tables li.last').hover(function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 -11px');
      }, function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 0');
      });
      
      
      //Function for doing the whole cell on the tables list clickable
      $('ul.your_tables li').click(function() {
        window.location.href = $(this).find("h4 > a.tableTitle").attr("href");
      });

      //Close all modal windows
      $('div.mamufas a.cancel, div.mamufas a.close_delete, div.mamufas a.close_settings, div.mamufas a.close_create').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.settings_window').hide();
          $('div.mamufas div.delete_window').hide();
          $('div.mamufas div.create_window').hide();
          resetUploadFile();
        });
        unbindESC();
      });



      //Delete window
      $('a.delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_id = $(this).attr('table-id');
        $('div.mamufas a.confirm_delete').attr('table-id',table_id);
        $('div.mamufas div.delete_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });
      $('a.confirm_delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_id = $(this).attr('table-id');
        $.ajax({
          type: "DELETE",
          url: '/api/json/tables/'+table_id,
          success: function(data, textStatus, XMLHttpRequest) {
            window.location.href = XMLHttpRequest.getResponseHeader("Location");
          },
          error: function(e) {
            console.debug(e);
          }
        });
      });
    });


    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.create_window').hide();
          });
        }
      });
    }

    function unbindESC() {
      $(document).unbind('keydown');
    }


