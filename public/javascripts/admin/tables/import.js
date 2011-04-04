
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
        debug: false,

        onSubmit: function(id, fileName){},
        onProgress: function(id, fileName, loaded, total){
          console.debug(id, fileName, loaded, total);
        },
        onComplete: function(id, fileName, responseJSON){
          console.debug(responseJSON);
        },
        onCancel: function(id, fileName){},
        messages: {
            // error messages, see qq.FileUploaderBasic for content
        },
        showMessage: function(message){ alert(message); }
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
            url: '/v1/tables/',
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
