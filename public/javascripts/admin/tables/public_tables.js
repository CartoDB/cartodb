
    head(function(){
      
      //Put paginator in middle
      var paginator_width = $('div.paginate').width();
      $('div.paginate').css('margin-left', ((626-paginator_width)/2) +'px');
      $('div.paginate').show();
      
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
      
      //Hover over last item of list
      $('ul.your_tables li.last').hover(function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 -11px');
      }, function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 0');
      });

      
      //Function for doing the whole cell on the tables list clickable
      $('ul.your_tables li').click(function() {
        window.location.href = $(this).find("h4 > a.tableTitle").attr("href");
      });


      // $('a.new_table').click(function(ev){
      //   ev.preventDefault();
      //   ev.stopPropagation();
      //   $('div.create_window').show();
      //   $('div.mamufas').fadeIn();
      //   bindESC();
      // });
      
      
      $('input#create_table').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.mamufas div.create_window div.inner_').animate({borderColor:'#FFC209', height:'68px'},500);
        $('div.mamufas div.create_window div.inner_ form').animate({opacity:0},300,function(){
          $('div.mamufas div.create_window div.inner_ span.loading').show();
          $('div.mamufas div.create_window div.inner_ span.loading').animate({opacity:1},500, function(){
            $.ajax({
              type: "POST",
              url: '/api/json/tables/',
              success: function(data, textStatus, XMLHttpRequest) {
                window.location.href = XMLHttpRequest.getResponseHeader("Location");
              },
              error: function(e) {
                console.debug(e);
              }
            });
          });
        });
        setTimeout(function(){$('div.mamufas div.create_window a.close_create').addClass('last');},250);
      });
      
      
      $('a.delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_id = $(this).attr('table-id');
        $('div.mamufas a.confirm_delete').attr('table-id',table_id);
        $('div.mamufas div.delete_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });

      $('div.mamufas a.close_settings, div.mamufas a.close_create').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.settings_window').hide();
          $('div.mamufas div.create_window').hide();
        });
        unbindESC();
      });
    });
    
    
    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.create_window').hide();
          });
        }
      });
    }

    function unbindESC() {
      $(document).unbind('keydown');
    }