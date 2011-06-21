

    head(function(){

      //Put paginator in middle
      var paginator_width = $('div.paginate').width();
      $('div.paginate').css('margin-left', ((626-paginator_width)/2) +'px');
      $('div.paginate').show();

      $('a.close').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div.section').fadeOut();
      });
      
      $('div.notification').delay(5000).fadeOut();

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
      $('div.mamufas a.cancel, div.mamufas a.close_delete, div.mamufas a.close_settings, div.mamufas a.close_create, div.mamufas a.close').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.settings_window').hide();
          $('div.mamufas div.delete_window').hide();
          $('div.mamufas div.create_window').hide();
          $('div.mamufas div.export_window').hide();
        });
        unbindESC();
      });



      //Delete window
      $('a.delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_name = $(this).attr('table-name');
        $('div.mamufas a.confirm_delete').attr('table-name',table_name);
        $('div.mamufas div.delete_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });
      $('a.confirm_delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_name = $(this).attr('table-name');
        $.ajax({
          type: "DELETE",
          dataType: "text",
          url:'/v1/tables/'+table_name,
          headers: {'cartodbclient':true},
          success: function(data, textStatus, XMLHttpRequest) {
            window.location.href = "/dashboard";
          },
          error: function(e) {
            console.debug(e);
          }
        });
      });
      
      
      
      //Export window
      $('a.export_data').click(function(ev){
        stopPropagation(ev);
        if ($('div.mamufas').is(':visible') && $('div.delete_window').is(':visible')) {
          $('div.mamufas div.export_window form').attr('action','/tables/'+$('div.mamufas a.confirm_delete').attr('table-name'));
          $('div.mamufas div.delete_window').hide();
          $('div.mamufas div.export_window').show();
        } else {
          $('div.mamufas div.export_window').show();
          $('div.mamufas').fadeIn('fast');
          bindESC();
        }
      });
      
      $('div.mamufas div.export_window form a.option').click(function(ev){
        stopPropagation(ev);
        var format = $(this).attr('rel');
        $('div.mamufas div.export_window form ul li').removeClass('selected');
        $(this).parent().addClass('selected');
        $('#export_format').val(format);
      });
      
      $('div.mamufas div.export_window form').submit(function(ev){
        bindESC();
      });
      
      $('#export_format').val($('div.mamufas div.export_window form ul li.selected a.option').attr('rel'));
    });


    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.create_window').hide();
            $('div.mamufas div.export_window').hide();
          });
        }
      });
    }

    function unbindESC() {
      $(document).unbind('keydown');
    }


