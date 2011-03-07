
    var create_type = 0;
    var interval = null;
    
  
    head(function(){
      
      //Create new table
      $('a.new_table').click(function(ev){
         ev.preventDefault();
         ev.stopPropagation();
         $('div.create_window').show();
         $('div.mamufas').fadeIn();
         bindESC();
       });
      
      
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
                     georeferenceImport();
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
      });
      
      
      
      $('form#import_file').submit(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (create_type==0) {
          createNewToFinish();
        }
      });
    });
    
    
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
      $('div.create_window ul li:eq(1)').removeClass('finished');
      $('div.create_window').removeClass('georeferencing');
    }


    function georeferenceImport() {
      $('div.create_window').addClass('georeferencing');
      $('span.georeference ul li:eq(0)').addClass('selected');
      $('div.create_window ul li:eq(1)').addClass('finished');
      $('form input[type="submit"]').removeClass('disabled');
      $('span.file div.progress p').html('<strong>69 rows</strong> correctly imported!');
      
      
      
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
