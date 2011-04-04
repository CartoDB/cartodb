
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

      var uploader = new qq.FileUploader({
        element: document.getElementById('uploader'),
        action: '/upload',
        params: {},
        allowedExtensions: ['csv', 'xls', 'zip'],
        sizeLimit: 0, // max size
        minSizeLimit: 0, // min size
        debug: true,

        onSubmit: function(id, fileName){
          $('div.create_window ul li:eq(0)').addClass('disabled');
          $('form input[type="submit"]').addClass('disabled');
          $('span.file').addClass('uploading');
        },
        onProgress: function(id, fileName, loaded, total){
          var percentage = loaded / total;
          $('span.progress').width((346*percentage)/1);
        },
        onComplete: function(id, fileName, responseJSON){
          createNewToFinish(responseJSON.file_uri);
           // {file_uri:"sdfasdfasfsadfadsf"}
        },
        onCancel: function(id, fileName){},
        showMessage: function(message){ alert(message); }
      });

      $('form#import_file').submit(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (create_type==0) {
          createNewToFinish('');
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


    function createNewToFinish (url) {
      $('div.create_window div.inner_').animate({borderColor:'#FFC209', height:'68px'},500);
      $('div.create_window div.inner_ form').animate({opacity:0},300,function(){
        $('div.create_window div.inner_ span.loading').show();
        $('div.create_window div.inner_ span.loading').animate({opacity:1},200, function(){
          var params = {}
          if (url!='') {
            params = {file:url};
          }
          
          $.ajax({
            type: "POST",
            url: '/v1/tables/',
            data: params,
            headers: {'cartodbclient':true},
            success: function(data, textStatus, XMLHttpRequest) {
              window.location.href = "/tables/"+data.id;
            },
            error: function(e) {
              console.debug(e);
            }
          });
        });
      });
      setTimeout(function(){$('div.create_window a.close_create').addClass('last');},250);
    }
