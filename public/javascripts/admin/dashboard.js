
    var create_type = 0;
    var interval = null;
    

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

      
      
      
      
      //Create new table
      $('div.create_window ul li a').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (!$(this).parent().hasClass('selected') && !$(this).parent().hasClass('disabled')) {
          $('div.create_window ul li').removeClass('selected');
          $(this).parent().addClass('selected');
          (create_type==0)?create_type++:create_type--;
        }
      });
      
      $('span.file input').hover(function(ev){
        $('span.file a').addClass('hover');
        $(document).css('cursor','pointer');
      },function(ev){
        $('span.file a').removeClass('hover');
        $(document).css('cursor','default');
      });
      
      $('input[type="file"]').change(function(ev){
        $('div.select_file p').text($(this).attr('value').split('\\')[2]);
      });

      $('a.new_table').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.create_window').show();
        $('div.mamufas').fadeIn();
        bindESC();
      });

      $('form#import_file').submit(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (create_type==0) {
          createNewToFinish();
        } else {
          if ($('form input[type="file"]').attr('value')!='' && !$('form input[type="submit"]').hasClass('disabled')) {
            $('div.create_window ul li:eq(0)').addClass('disabled');
            $('form input[type="submit"]').addClass('disabled');
            $('span.file').addClass('uploading');
            
            var uuid= '';
            for (i = 0; i < 32; i++) {
              uuid += Math.floor(Math.random() * 16).toString(16);
            }

            $.ajax({
              type: "POST",
              url: '/api/json/tables/?X-Progress-ID='+uuid,
              success: function(data, textStatus, XMLHttpRequest) {
                
                function fetch(uuid) {
                  $.ajax({
                    type: "GET",
                    url: '/progress?X-Progress-ID='+uuid,
                    success: function(result, textStatus, XMLHttpRequest) {
                      var percentage = result.received / result.size;
                      $('span.progress').width((346*percentage)/1);
                      if (result.state == 'done') {
                       window.clearTimeout(interval);
                      }
                    },
                    error: function(e) {
                      console.debug(e);
                    }
                  });
                }

                interval = window.setInterval(function () {fetch(uuid);},200);
              },
              error: function(e) {
                console.debug(e);
              }
            });
          }
        }
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


      //Settings window
      $('a.settings').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas div.settings_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
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
    
    
    function resetUploadFile() {
      window.clearTimeout(interval);
      create_type = 0;
      $('div.create_window ul li:eq(0)').removeClass('disabled');
      $('div.create_window ul li').removeClass('selected');
      $('div.create_window ul li:eq(0)').addClass('selected');
      $('form input[type="submit"]').removeClass('disabled');
      $('span.file').removeClass('uploading');
      $('span.file input[type="file"]').attr('value','');
      $('div.select_file p').text('You can import .csv and .xls files');
      $('span.progress').width(5);
    }
    
    
    function createNewToFinish () {
      $('div.create_window div.inner_').animate({borderColor:'#FFC209', height:'68px'},500);
      $('div.create_window div.inner_ form').animate({opacity:0},300,function(){
        $('div.create_window div.inner_ span.loading').show();
        $('div.create_window div.inner_ span.loading').animate({opacity:1},200, function(){
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
      setTimeout(function(){$('div.create_window a.close_create').addClass('last');},250);
    }
    
