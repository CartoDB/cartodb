///////////////////////////////////////
//  Import data window               //
///////////////////////////////////////
var import_window = (function(){
  
  $('div.mamufas').append(
    '<div class="import_window">'+
      '<a href="#close_window" class="close"></a>'+
      '<div class="inner_">'+
        '<span class="loading">'+
          '<h5>We are importing your data...</h5>'+
          "<p>It shouldn't take long, just a few more seconds ok?</p>"+
        '</span>'+
        '<form action="#import_file" id="import_file" enctype="multipart/form-data" method="post">'+
          '<span class="top">'+
            '<h4>Do you want to import some data to this table now?</h4>'+
            '<p>Be sure your data has the same schema</p>'+
            '<ul>'+
              '<li class="selected">'+
                '<a href="#">I want to add some data from a file</a>'+
                '<span class="file">'+
                  '<div class="select_file">'+
                    '<div id="uploader"></div>'+
                    '<p>You can import .csv, .xls or .zip files</p>'+
                  '</div>'+
                  '<div class="progress">'+
                    '<p>Uploading your file...</p>'+
                    '<span class="progress"></span>'+
                  '</div>'+
                '</span>'+
              '</li>'+
              '<li>'+
                '<a href="#">I want to add some data from a URL</a>'+
                '<span class="file">'+
                  '<div class="select_file">'+
                    '<input id="url_txt" type="text" name="url_value" value="Insert a valid URL..."/>'+
                  '</div>'+
                '</span>'+
              '</li>'+
            '</ul>'+
          '</span>'+
          '<span class="bottom">'+
            '<a href="#" class="cancel">cancel</a>'+
            '<input id="create_table" type="submit" name="submit" value="Create table"/>'+
          '</span>'+
        '</form>'+
      '</div>'+
    '</div>'
  );
	
  $('div.import_window span.bottom input').addClass('disabled');
	
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
    allowedExtensions: ['csv', 'xls', 'xlsx', 'zip'],
    sizeLimit: 0, // max size
    minSizeLimit: 0, // min size
    debug: false,

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
      createNewToFinish('',responseJSON.file_uri);
    },
    onCancel: function(id, fileName){},
    showMessage: function(message){
      $('div.select_file p').text(message);
      $('div.select_file p').addClass('error');
    }
  });

  $('div.import_window div.inner_ ul li a').click(function(ev){
    var createType = $(this).closest('li').index();
    ev.stopPropagation();
    ev.preventDefault();
    if (!$(this).parent().hasClass('selected') && !$(this).parent().hasClass('disabled') && !$(this).parent().is("span")) {
      $('div.import_window ul li').removeClass('selected');
      $(this).parent().addClass('selected');
    }        
  
    if (($(this).closest('li').index()==0) || (($(this).closest('li').index()==1) && ($('div.select_file input#url_txt').val() == "Insert a valid URL..."))) {
			$('div.import_window span.bottom input').addClass('disabled');
		}else{
			$('div.import_window span.bottom input').removeClass('disabled');
		}
  
  });

  $('div.select_file input#url_txt').focusin(function(){
    $(this).val('');
    $('div.import_window span.bottom input').removeClass('disabled');        
  });
  
  $('div.select_file input#url_txt').focusout(function(){
    if ($(this).val() == ""){
  	  $(this).val('Insert a valid URL...');  
      $('div.import_window span.bottom input').addClass('disabled');
    }else{
	    $('div.import_window span.bottom input').removeClass('disabled');
    }
  });
  
  // TODO try to get this working. For any reason the change event is not being triggered.
  //      the solution just do the previous code more messy  
  // $('div.select_file input#url_txt').change(function(){
  //    console.log('hola');
  //    if ($(this).val() == ""){
  //      $('div.import_window span.bottom input').removeClass('disabled');
  //    }
  // });
  
  //TODO create the function to send the URL to the server.
  
  $('a.import_data').livequery('click',function(ev){
    stopPropagation(ev);
		if (!$(this).closest('li').hasClass('disabled')) {
			closeOutTableWindows();
      $('div.mamufas div.import_window').show();
      $('div.mamufas').fadeIn('fast');
      bindESC();
		}
  });
  
  $('form#import_file').submit(function(ev){
    ev.stopPropagation();
    ev.preventDefault();
    if(create_type==1){
      // console.log('send url');
      // TODO send url to the server
    }
  });



  function resetUploadFile() {
    $('div.import_window div.inner_ span.top').show();
    $('div.import_window div.inner_ span.bottom').show();
    $('div.import_window div.inner_ span.top').css('opacity',1);
    $('div.import_window div.inner_ span.bottom').css('opacity',1);
    $('div.import_window div.inner_').css('border-color','#CCCCCC');
    $('div.import_window a.close').removeClass('last');
    $('div.import_window div.inner_').css('height','auto');
    $('div.import_window div.inner_ span.loading').hide();
    $('div.import_window div.inner_ span.loading').css('opacity',0);
    $('form input[type="submit"]').removeClass('disabled');
    $('span.file').removeClass('uploading');
    $('span.file input[type="file"]').attr('value','');
    $('div.select_file p').text('You can import .csv, .xls and .zip files');
    $('div.select_file p').removeClass('error');
    $('span.progress').width(5);
    $('div.import_window ul li:eq(1)').removeClass('finished');
    $('div.import_window').removeClass('georeferencing');
    $('div.import_window div.inner_ span.loading p').html('It\'s not gonna be a lot of time. Just a few seconds, ok?');
    $('div.import_window div.inner_ span.loading h5').html('We are creating your table...');
    
    $('div.import_window span.bottom input').removeClass('disabled');

  }


  function createNewToFinish (type,url) {
    $('div.import_window div.inner_').animate({borderColor:'#FFC209', height:'68px'},500);

    $('div.import_window div.inner_ span.bottom').animate({opacity:0});
    $('div.import_window div.inner_ span.top').animate({opacity:0},300,function(){
      $('div.import_window div.inner_ span.top').hide();
      $('div.import_window div.inner_ span.bottom').hide();
      $('div.import_window div.inner_ span.loading').show();
      $('div.import_window div.inner_ span.loading').animate({opacity:1},200, function(){
        var params = {}
        if (url!='') {
          params = {file:'http://'+window.location.host + url};
        } else {
          params = {the_geom_type:type}
        }
        // $.ajax({
        //   type: "POST",
        //   url: '/v1/tables/',
        //   data: params,
        //   headers: {'cartodbclient':true},
        //   success: function(data, textStatus, XMLHttpRequest) {
        //     window.location.href = "/tables/"+data.id;
        //   },
        //   error: function(e) {
            $('div.import_window div.inner_ span.loading').addClass('error');
            $('div.import_window div.inner_ span.loading p').html('Something weird has occurred when creating your table. Do you want to <a onclick="retryImportTable()">retry</a>?');
            $('div.import_window div.inner_ span.loading h5').text('Ooops! There has been an error');
            $('div.import_window div.inner_').height(78);
        //   }
        // });
      });
    });
    setTimeout(function(){$('div.import_window a.close').addClass('last');},250);
  }


  function retryImportTable() {
    $('div.import_window a.close').removeClass('last');
    $('div.import_window div.inner_').animate({borderColor:'#CCCCCC', height:'254px'},500,function(){
      $('div.import_window div.inner_').css('height','auto');
    });
    $('span.file').removeClass('uploading');
    $('div.import_window div.inner_ span.loading').animate({opacity:0},300,function(){
      $('div.import_window div.inner_ span.loading').hide();
      $('div.import_window div.inner_ span.loading').removeClass('error');
      $('div.import_window div.inner_ span.loading p').html('It\'s not gonna be a lot of time. Just a few seconds, ok?');
      $('div.import_window div.inner_ span.loading h5').html('We are creating your table...');
      $('div.import_window div.inner_ span.top').show();
      $('div.import_window div.inner_ span.top').animate({opacity:1},200);
      $('div.import_window div.inner_ span.bottom').show();
      $('div.import_window div.inner_ span.bottom').animate({opacity:1},200);
    });
  }

	return {}
}());