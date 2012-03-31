
    var create_type = 0;
    var interval = null;


    head(function(){

      $('div.geom_type span').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (!$(this).hasClass('selected')) {
          $('div.geom_type span').removeClass('selected');
          $(this).addClass('selected');
        }
      });
      
      $('div.geom_type span a').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).parent().trigger('click');
      });


      //Create new table
      $('a.new_table').click(function(ev){
         stopPropagation(ev);
         resetUploadFile();
         if (!$(this).hasClass('disabled')) {
           $('div.create_window').show();
           $('div.mamufas').fadeIn();
           bindESC();
         }
      });

      $('a.see_more').live('click',function(ev){
      	stopPropagation(ev);
      	var $parent = $(this).closest('span');
      	$parent.find('span')
          .show()
          .css('display','block');
      	$parent.find('p.see_details').remove();
      	$('div.create_window div.inner_').height($('div.create_window div.inner_ span.loading').height() + 30);
      })


      $('div.select_file input#url_txt').focusin(function(){
         $(this).val('');
         $('div.create_window span.bottom input').removeClass('disabled');        
 	    });
	    
      $('div.select_file input#url_txt').focusout(function(){
   	    if ($(this).val() == ""){
       	  $(this).val('Insert a valid URL...');  
           $('div.create_window span.bottom input').addClass('disabled');
   	    }else{
     	    $('div.create_window span.bottom input').removeClass('disabled');
   	    }
 	    });


      $('div.create_window ul li a').click(function(ev){
        stopPropagation(ev);
        create_type = $(this).closest('li').index();

        if (!$(this).parent().hasClass('selected') && !$(this).parent().hasClass('disabled') && !$(this).parent().is("span")) {
          $('div.create_window ul li').removeClass('selected');
          $(this).parent().addClass('selected');

          if (($(this).closest('li').index()==1) || ($(this).closest('li').index()==2) && $('div.select_file input#url_txt').val() == "Insert a valid URL...") {
            $('div.create_window span.bottom input').addClass('disabled');
          } else {
            $('div.create_window span.bottom input').removeClass('disabled');
          }
        }
				

      });
      

      $('span.file input').hover(function(ev){
        $('span.file a').addClass('hover');
        $(document).css('cursor','pointer');
      },function(ev){
        $('span.file a').removeClass('hover');
        $(document).css('cursor','default');
      });



      $('form#import_file').submit(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (!$('div.create_window span.bottom input').hasClass('disabled')) {
          if (create_type==0) {
            var geom_type = $('div.geom_type span.selected a').text().toLowerCase();
            
            if (geom_type=="point") {
              geom_type="point";              
            } else if (geom_type=="polygon") {
              geom_type="multipolygon";
            } else {
              geom_type="multilinestring";
            }
            
            createNewToFinish(geom_type,'');
          } else if (create_type==2) {
						var url = $('div.select_file input#url_txt').val();
						if (isURL(url)) {
							$('div.error_url').stop().fadeOut();
							createNewToFinish('',url,true);
						} else {
							$('div.error_url').stop().fadeIn().delay(2000).fadeOut();;
						}
          }
        }
      });
      
      
      //Uploader for the modal window
      var uploader = new qq.FileUploader({
        element: document.getElementById('uploader'),
        action: '/upload',
        params: {},
        allowedExtensions: ['csv', 'xls', 'xlsx', 'zip', 'kml', 'geojson', 'json', 'ods', 'kmz', 'gpx', 'tar', 'gz', 'tgz', 'osm', 'bz2'],
        sizeLimit: 0, // max size
        minSizeLimit: 0, // min size
        debug: false,
        onSubmit: function(id, fileName){
          $('div.create_window ul > li:eq(0)').addClass('disabled');
          $('div.create_window ul > li:eq(2)').addClass('disabled');
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
          $('div.select_file p').html(message);
          $('div.select_file p').addClass('error');
        }
      });
      
      
      //Uploader for the whole page (dashboard only)
      var hugeUploader = new qq.FileUploader({
      	element: document.getElementById('hugeUploader'),
      	action: '/upload',
      	params: {},
        allowedExtensions: ['csv', 'xls', 'xlsx', 'zip', 'kml', 'geojson', 'json', 'ods', 'kmz', 'gpx', 'tar', 'gz', 'tgz', 'osm', 'bz2'],
      	sizeLimit: 0,
      	minSizeLimit: 0,
      	debug: false,

      	onSubmit: function(id, fileName){
        	resetUploadFile();
      		$('div.create_window ul > li:eq(0)').addClass('disabled');
          $('div.create_window ul > li:eq(2)').addClass('disabled');
      		$('form input[type="submit"]').addClass('disabled');
      		$('span.file').addClass('uploading');
      		$('div.create_window ul li:eq(1) a').click();
          $('#hugeUploader').hide();
          $('div.create_window').show();
          $('div.mamufas').fadeIn();
          bindESC();		  
      	},
      	onProgress: function(id, fileName, loaded, total){
      		var percentage = loaded / total;
      		$('span.progress').width((346*percentage)/1);
      	},
      	onComplete: function(id, fileName, responseJSON){
      		createNewToFinish('',responseJSON.file_uri);
      		$('#hugeUploader').hide();
      	},
      	onCancel: function(id, fileName){},
      	showMessage: function(message){
          $('div.select_file p').html(message);
          $('div.select_file p').addClass('error');
          $('div.create_window ul li:eq(0)').addClass('disabled');
          $('form input[type="submit"]').addClass('disabled');
          $('div.create_window ul li:eq(1) a').click();
          $('#hugeUploader').hide();
          $('div.create_window').show();
          $('div.mamufas').fadeIn();
          bindESC();
      	}
      });
    });
    

    function resetUploadFile() {
      create_type = 0;
      $('div.select_file p').removeClass('error');
      $('div.create_window ul > li:eq(0)').removeClass('disabled');
      $('div.create_window ul > li:eq(2)').removeClass('disabled');
      $('div.create_window ul li').removeClass('selected');
      $('div.create_window ul li:eq(0)').addClass('selected');
      $('div.create_window div.inner_ form').show();
      $('div.create_window div.inner_ form').css('opacity',1);
      $('div.create_window div.inner_').css('border-color','#CCCCCC');
      $('div.create_window a.close_create').removeClass('last');
      $('div.create_window div.inner_').css('height','auto');
      $('div.create_window div.inner_ span.loading').hide();
      $('div.create_window div.inner_ span.loading').css('opacity',0);
      $('form input[type="submit"]').removeClass('disabled');
      $('span.file').removeClass('uploading');
      $('div.create_window div.inner_ span.loading').removeClass('error');
      $('span.file input[type="file"]').attr('value','');
      $('div.select_file span.file p').text('We support xls, csv, gpx, shp, zip, etc...');
      $('div.select_file span.file p').removeClass('error');
      $('span.progress').width(5);
      $('div.create_window ul li:eq(1)').removeClass('finished');
      $('div.create_window').removeClass('georeferencing');
      $('div.create_window div.inner_ span.loading').html('');
			$('div.create_window div.inner_ span.loading').append('<h5>We are creating your table...</h5>');
      $('div.create_window div.inner_ span.loading').append('<p>It\'s not gonna be a lot of time. Just a few seconds, ok?</p>');
      $('div.qq-upload-drop-area').hide();
    }


    function createNewToFinish (type,url,out) {
      $('div.create_window div.inner_').animate({borderColor:'#FFC209', height:'68px'},500);
      $('div.create_window div.inner_ form').animate({opacity:0},300,function(){
        $('div.create_window div.inner_ span.loading').show();
				$('div.create_window a.close_create').hide();
        $('div.create_window div.inner_ span.loading').animate({opacity:1},200, function(){
          var params = {}
          if (url!='') {
            if (!out) {
              params = {file:'http://'+window.location.host + url};
            } else {
              params = {file:url};
            }
          } else {
            params = {the_geom_type:type}
          }
          $.ajax({
            type: "POST",
            url: global_api_url+'tables/',
            data: params,
            headers: {'cartodbclient':true},
            success: function(data, textStatus, XMLHttpRequest) {
              if (data.tag){
                  window.location.href = "/dashboard?tag_name="+data.tag;
              }else{
                  window.location.href = "/tables/"+data.id;
              }
            },
            error: function(e) {
							var json = $.parseJSON(e.responseText);

							if (json.code || json.import_errors) {

								// Reset
								$('div.create_window div.inner_ span.loading').html('');

								// Title
								$('div.create_window div.inner_ span.loading').html('<h5>Oops! There has been an error</h5>');

								// Description
								if (json.description) {
									$('div.create_window div.inner_ span.loading').append('<p>' + json.description + '</p>');
								}

								// Stack
								if (json.stack && json.stack.length>0) {
									$('div.create_window div.inner_ span.loading').append('<p class="see_details"><a class="see_more" href="#show_more">see details</a></p>');
									
									var stack = '<span class="error_details"><h6>Code ' + (json.code || '') + '</h6><dl>';
									for (var i=0,_length=json.stack.length; i<_length; i++) {
										stack += '<dd>' + json.stack[i] + '</dd>';
									}
									stack += '</dl></span>';
									$('div.create_window div.inner_ span.loading').append(stack);
								}
                
							} else {
                $('div.create_window div.inner_ span.loading p').html('There has been an error, please <a href="mailto:support@cartodb.com">contact us</a> with a sample of your data if possible. Thanks!');
                $('div.create_window div.inner_ span.loading h5').text('Oops! Error');
							}
						  $('div.create_window div.inner_ span.loading').addClass('error');
							$('div.create_window a.close_create').show().addClass('last');
              $('div.create_window div.inner_').height($('div.create_window div.inner_ span.loading').height() + 30);
            }
          });
        });
      });
      setTimeout(function(){$('div.create_window a.close_create').addClass('last');},250);
    }
    
    
    function retryImportTable() {
      $('div.create_window a.close_create').show().removeClass('last');
      $('div.create_window div.inner_').animate({borderColor:'#CCCCCC', height:'254px'},500,function(){
        $('div.create_window div.inner_').css('height','auto');
      });
      $('div.create_window ul li:eq(0)').removeClass('disabled');
      $('form input[type="submit"]').removeClass('disabled');
      $('span.file').removeClass('uploading');
      $('div.create_window div.inner_ span.loading').animate({opacity:0},300,function(){
        $('div.create_window div.inner_ span.loading').hide();
        $('div.create_window div.inner_ span.loading').removeClass('error');
        $('div.create_window div.inner_ span.loading').html('');
				$('div.create_window div.inner_ span.loading').append('<h5>We are creating your table...</h5>');
        $('div.create_window div.inner_ span.loading').append('<p>It\'s not gonna be a lot of time. Just a few seconds, ok?</p>');
        $('div.create_window div.inner_ form').show();
        $('div.create_window div.inner_ form').animate({opacity:1},200);
        $('div.select_file p').text('We support xls, csv, gpx, shp, zip, etc...');
        $('div.select_file p').removeClass('error');
      });
    }


