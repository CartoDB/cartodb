
  //SUBHEADER EVENTS AND FLOATING WINDOWS+//
  var editor;
  

  head(function(){
	
		///////////////////////////////////////
    //  Mamufas addition                 //
    ///////////////////////////////////////
		var mamufas = $('div.mamufas').append(
      '<div class="delete_window">'+
        '<a href="#close_window" class="close"></a>'+
        '<div class="inner_">'+
          '<span class="top">'+
            '<h3>You are about to delete this table</h3>'+
            '<p>You will not be able to recover this information. We really recommend to <a class="export_data" href="#export_data">export the data</a> before deleting it.</p>'+
          '</span>'+
          '<span class="bottom">'+
            '<a href="#close_window" class="cancel">cancel</a>'+
            '<a href="#confirm_delete" class="confirm_delete">Delete this table</a>'+
          '</span>'+
        '</div>'+
      '</div>'+
      '<div class="export_window">'+
        '<a href="#close_window" class="close"></a>'+
        '<div class="inner_">'+
          '<form action="/tables/'+ table_id +'" method="get">'+
            '<input id="export_format" type="hidden" name="format" />'+
            '<span class="top">'+
              '<h3>Export your data</h3>'+
              '<p>Select your desired format for downloading the data</p>'+
              '<ul>'+
                '<li class="selected"><a class="option" href="#CSV" rel="csv">CSV (Comma separated values)</a></li>'+
                '<li class="disabled"><a class="option" href="#KML" rel="kml">KML</a></li>'+
                '<li><a class="option" href="#SHP" rel="shp">SHP</a></li>'+
              '</ul>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<input type="submit" class="download" value="Download" />'+
            '</span>'+
        '</div>'+
      '</div>'+
      '<div class="save_window">'+
        '<a href="#close_window" class="close"></a>'+
        '<div class="inner_">'+
          '<span class="top">'+
            '<h3>Insert a name for your copy of this table</h3>'+
            '<input type="text"/>'+
          '</span>'+
          '<span class="bottom">'+
            '<a href="#close_window" class="cancel">cancel</a>'+
            '<a href="#save_table" class="table_save" >Save table</a>'+
          '</span>'+
        '</div>'+
      '</div>'+
      '<div class="warning_window">'+
        '<a href="#close_window" class="close"></a>'+
        '<div class="inner_">'+
          '<span class="top">'+
            '<h3>This change will affect your API calls</h3>'+
            '<p>If you are accesing to this table via API don’t forget to update the name in the API calls after changing the name.</p>'+
          '</span>'+
          '<span class="bottom">'+
            '<a href="#close_window" class="cancel">cancel</a>'+
            '<a href="#confirm_delete" class="continue">Ok, continue</a>'+
          '</span>'+
        '</div>'+
      '</div>'+
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
              '<p> </p>'+
              '<ul>'+
                '<li class="disabled">'+
                  '<a href="#">I want to create an empty table</a>'+
                '</li>'+
                '<li class="selected">'+
                  '<a href="#">I want to start with some imported data</a>'+
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
              '</ul>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#" class="cancel">cancel</a>'+
            '</span>'+
          '</form>'+
        '</div>'+
      '</div>'
      );
	
	
    
    ///////////////////////////////////////
    //  Bottom bar with tools (SQL,...)  //
    ///////////////////////////////////////
		var general_options = (function() {
			
			//Append general options to document
			$('body').append(
	      '<div class="general_options table">'+
	        '<ul>'+
	          '<li class="all"><a class="sql" href="#open_sql">SQL</a></li>'+
	          '<li class="table"><a href="#add_row" class="add_row">Add row</a></li>'+
	          '<li class="table"><a href="#add_column" class="add_column">Add column</a></li>'+
	          '<li class="selected map"><a class="select">select</a></li>'+
	          '<li class="map"><a class="add">add</a></li>'+
	          '<li class="map"><a class="select_area">select_area</a></li>'+
	        '</ul>'+

	        '<div class="tooltip">'+
	          '<p>select</p>'+
	          '<span class="arrow"></span>'+
	        '</div>'+
	      '</div>'+

				//SQL Console
	      '<div class="sql_window">'+
	      	'<a href="#close_this_view" class="close">close this view</a>'+
					'<div class="inner">'+
	       		'<h3>Add your custom SQL query</h3>'+
						'<p>You can free move or close this window to watch the table</p>'+
		        '<div class="outer_textarea"><textarea id="sql_textarea"></textarea></div>'+
		        '<span class="bottom">'+
		          '<a href="#apply" class="try_query">Apply query</a>'+
		          '<a href="#clear" class="clear_table">Clear view</a>'+
							'<span class="blablabla"></span>'+
		          '<p class="errors">Your query is not correct, try again with another ;)</p>'+
		        '</span>'+
					'</div>'+
	      '</div>');
	
			/*******************/
			/* Event listeners */
			/*******************/
			// SQL editor
			editor = CodeMirror.fromTextArea(document.getElementById("sql_textarea"), {
	      lineNumbers: false,
	      mode: "text/x-plsql",
				onKeyEvent: function(editor,event) {
					if (event.ctrlKey && event.keyCode == 13 && event.type == "keydown") {
						stopPropagation(event);
						$('div.sql_window a.try_query').trigger('click');
					}
				}
	    });
			
			// Draggable and resizable capacities to sql window
	    $('div.sql_window').draggable({appendTo: 'body'}).resizable({maxWidth:800,maxHeight:400});
			
			// Open sql console
			$('div.general_options a.sql, p a.open_console').livequery('click',function(ev){
			  stopPropagation(ev);
				if ($('div.sql_window').is(':visible')) {
					closeOutTableWindows();
				} else {
					$('div.sql_window').removeAttr('style');
	        $('div.sql_window').show();
					bindESC();
	        editor.focus();
				}
			});
			
			// Clear sql mode and back to normal state
			$('a.clear_table').livequery('click',function(ev){
				stopPropagation(ev);
			  closeOutTableWindows();
				var query_mode = ($('body').attr('query_mode') === "true");
			  if (query_mode) {
					$('body').attr('query_mode','false');
					// Send trigger to refresh app
			    $('body').trigger('query_refresh');
					setAppStatus();	// Out function to change app to SQL or NORMAL
			  }
			});
			
			$('div.sql_window a.close_sql').livequery('click',function(ev){
	    	stopPropagation(ev);
	      closeOutTableWindows();
	    });
			
			return {}
		}());



	  ///////////////////////////////////////
    //  Advanced options                 //
    ///////////////////////////////////////
		var advanced_options = (function() {
			
			$('div.inner_subheader div.right').append(
	      '<span class="advanced_options">'+
	        '<a href="#close_advanced_options" class="advanced">advanced<span></span></a>'+
	        '<ul>'+
	          '<li class="disabled"><a class="import_data">Import data...</a></li>'+
	          '<li><a class="export_data">Export data...</a></li>'+
	          '<li class="disabled"><a class="save_table">Save table as...</a></li>'+ //class="save_table"
	        '</ul>'+
	      '</span>');
	
	    $('p.settings a.settings, span.advanced_options a.advanced').livequery('click',function(ev){
	      stopPropagation(ev);
	      if (!$('span.advanced_options').is(':visible')) {
	        closeOutTableWindows();
	        bindESC();
	        $(this).parent().parent().children('span.advanced_options').show();
	        $('body').click(function(event) {
	          if (!$(event.target).closest('span.advanced_options').length) {
	            $('span.advanced_options').hide();
	            $('body').unbind('click');
	          };
	        });
	      } else {
	        $(this).parent().hide();
	        $('body').unbind('click');
	      }
	    });
	
	    $('a.save_table').click(function(ev){
	      stopPropagation(ev);
	      //closeOutTableWindows();
	      // $('div.mamufas div.save_window').show();
	      // $('div.mamufas').fadeIn('fast');
	      // bindESC();
	    });
	
	    $('a.table_save').click(function(ev){
	      stopPropagation(ev);
	      closeOutTableWindows();
	    });
	
	    $('a.export_data').click(function(ev){
	      stopPropagation(ev);
	      if ($('div.mamufas').is(':visible') && $('div.delete_window').is(':visible')) {
	        $('div.mamufas div.delete_window').hide();
	        $('div.mamufas div.export_window').show();
	      } else {
	        closeOutTableWindows();
	        $('div.mamufas div.export_window').show();
	        $('div.mamufas').fadeIn('fast');
	        bindESC();
	      }
	    });
			
			return {}
		}());
		
		

    ///////////////////////////////////////
    //  Delete table                     //
    ///////////////////////////////////////
		var delete_table = (function() {
			$('a.delete').livequery('click',function(ev){
	      stopPropagation(ev);
	      closeOutTableWindows();
	      var table_id = $(this).attr('table-id');
	      $('div.mamufas a.confirm_delete').attr('table-id',table_id);
	      $('div.mamufas div.delete_window').show();
	      $('div.mamufas').fadeIn('fast');
	      bindESC();
	    });
	
	    $('div.mamufas a.cancel, div.mamufas a.close').click(function(ev){
	      stopPropagation(ev);
	      $('div.mamufas').fadeOut('fast',function(){
	        $('div.mamufas div.delete_window').hide();
	      });
	      unbindESC();
	    });
	
	    $('a.confirm_delete').click(function(ev){
	      stopPropagation(ev);
	      $.ajax({
	        type: "DELETE",
	        url: global_api_url+'tables/'+table_name,
	        dataType: "text",
	        headers: {'cartodbclient':true},
	        success: function(data, textStatus, XMLHttpRequest) {
						$.cookie('flash', 'Table successfully removed');
	          window.location.href = '/dashboard';
	        },
	        error: function(e) {
	          console.debug(e);
	        }
	      });
	    });
	
			return {}
		}());



    ///////////////////////////////////////
    //  Export table                     //
    ///////////////////////////////////////
		var export_table = (function() {
			
	    $('div.mamufas div.export_window form a.option').click(function(ev){
	      stopPropagation(ev);
				if (!$(this).parent().hasClass('disabled')) {
					var format = $(this).attr('rel');
		      $('div.mamufas div.export_window form ul li').removeClass('selected');
		      $(this).parent().addClass('selected');
		      $('#export_format').val(format);
				}
	    });
	
	    $('div.mamufas div.export_window form').submit(function(ev){
	      closeOutTableWindows();
	    });
	
	    $('#export_format').val($('div.mamufas div.export_window form ul li.selected a.option').attr('rel'));
	
			return {}
		}());



    ///////////////////////////////////////
    //  Import data window               //
    ///////////////////////////////////////
		var import_window = (function(){
			
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

	    $('a.import_data').livequery('click',function(ev){
	      stopPropagation(ev);
				if (!$(this).closest('li').hasClass('disabled')) {
					closeOutTableWindows();
		      $('div.mamufas div.import_window').show();
		      $('div.mamufas').fadeIn('fast');
		      bindESC();
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
		            $('div.import_window div.inner_ span.loading h5').text('Ops! There has been an error');
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
		


    ///////////////////////////////////////
    //  Change title name window         //
    ///////////////////////////////////////
		var title_name = (function() {
			
	    $('div.inner_subheader div.left').append(
	      '<span class="title_window">'+
	        '<p>Pick a name for this table</p>'+
	        '<form id="change_name" method="get" action="#"><input type="text" name="title"/>'+
	        '<input type="submit" value="Save" name="submit"/></form>'+
	        '<span>The name cannot be blank</span>'+
	      '</span>');
	
	    //Bind events
	    // -Open window
	    $('section.subheader h2 a, p.status a.save').livequery('click',function(ev){
	      stopPropagation(ev);
	      if ($('span.title_window').is(':visible')) {
	        $('span.title_window').hide();
	      } else {
	        closeOutTableWindows();
	        bindESC();
	        $('span.title_window input[type="text"]').attr('value',$('section.subheader h2 a').text());
	        $('body').click(function(event) {
	          if (!$(event.target).closest('span.title_window').length) {
	            $('span.title_window').hide();
	            $('body').unbind('click');
	          };
	        });
	        $('span.title_window').show();
	        $('span.title_window input[type="text"]').focus();
	      }
	    });
	
	    // -Save table name
	    $('#change_name input[type="submit"]').livequery('click',function(ev){
	      stopPropagation(ev);
	      var new_value = sanitizeText($('span.title_window input[type="text"]').attr('value'));
	      var old_value = new Object();
	      old_value.name = $('section.subheader h2 a').text();
	      if (new_value==old_value.name) {
	        $('span.title_window').hide();
	      } else if (new_value=='') {
	        $('span.title_window input').css('border-color','#D05153');
	        $('span.title_window span').fadeIn();
	        setTimeout(function(){
	          $('span.title_window input').css('border-color','#999999');
	          $('span.title_window span').fadeOut();
	        },1500);
	      } else {
	        // If the name of the table is Untitle_table... - not show warning
	        if ((old_value.name).search('untitle_table')==-1) {
	          closeOutTableWindows();
	          $('div.mamufas div.warning_window a.continue').unbind('click');
	          $('div.mamufas div.warning_window a.continue').click(function(ev){
	            stopPropagation(ev);
	            changeTableName(new_value,old_value);
	          });
          
	          $('div.mamufas div.warning_window').show();
	          $('div.mamufas').fadeIn('fast');
	          bindESC();
	        } else {
	          changeTableName(new_value,old_value);
	        }
        
	        // Function to change the table name final steps
	        function changeTableName(new_value,old_value) {
	          if ($('p.status a').hasClass('save')) {
	            old_value.status = 'save';
	            $('p.status a').removeClass('save').addClass('public').text('public');
	          }
	          $('section.subheader h2 a').text(new_value);
	          $('span.title_window').hide();
	          changesRequest('name',new_value,old_value);
	          closeOutTableWindows();
	        }
        
	      }
	    });

			return {}
		}());


    ///////////////////////////////////////
    //  Change table status              //
    ///////////////////////////////////////
		var table_status = (function() {
	    $('div.inner_subheader div.left').append(
	      '<span class="privacy_window">'+
	        '<ul>'+
	          '<li class="public disabled"><a href="#"><strong>Public</strong> (visible to others)</a></li>'+
	          '<li class="private '+((status=="private")?'selected':'')+'"><a href="#"><strong>Private</strong> (visible to you)</a></li>'+
	        '</ul>'+
	      '</span>');

	    $('span.privacy_window ul li a').livequery('click',function(ev){
	      stopPropagation(ev);
	      var parent_li = $(this).parent();
	      if (!parent_li.hasClass('disabled')) {
	        if (parent_li.hasClass('selected')) {
	          $('span.privacy_window').hide();
	        } else {
	          var old_value = $('span.privacy_window ul li.selected a strong').text().toLowerCase();
	          $('span.privacy_window ul li').removeClass('selected');
	          parent_li.addClass('selected');
	          var new_value = $('span.privacy_window ul li.selected a strong').text().toLowerCase();
	          $('span.privacy_window').hide();
	          $('p.status a').removeClass('public private').addClass(new_value).text(new_value);
	          changesRequest('privacy',new_value.toUpperCase(),old_value);
	        }
	      }
	    });

	    $('p.status a').livequery('click',function(ev){
	      stopPropagation(ev);
	      var privacy_window = $(this).closest('div.left').children('span.privacy_window');
	      if (!$(this).hasClass('save')) {
	        if (privacy_window.is(':visible')) {
	          privacy_window.hide();
	        } else {
	          closeOutTableWindows();
	          bindESC();
	          var status_position = $('p.status a').position();
	          privacy_window.css('left',status_position.left-72+'px').show();
	          $('body').click(function(event) {
	            if (!$(event.target).closest('span.privacy_window').length) {
	              $('span.privacy_window').hide();
	              $('body').unbind('click');
	            };
	          });
	        }
	      }
	    });
	
			return {}
		}());


    ///////////////////////////////////////
    //  Change table tags                //
    ///////////////////////////////////////
		var table_tags = (function() {
			
			$('div.inner_subheader div.left').append(
	      '<span class="tags_window">'+
	        '<ul id="tags_list"></ul>'+
	        '<a id="save_all_tags" href="#save_tags">Save</a>'+
	      '</span>');

	    $('span.tags a.add').click(function(ev){
	      stopPropagation(ev);
	      closeOutTableWindows();
	      bindESC();
	      var values = [];
	      $('span.tags p').each(function(index,element){
	        values.push($(element).text());
	      });
	      $("#tags_list").tagit({values: values});
	      $('span.tags_window').show();
	      $('body').click(function(event) {
	        if (!$(event.target).closest('span.tags_window').length) {
	          $('span.tags_window').hide();
	          $('body').unbind('click');
	        };
	      });
	    });
	
	    $('span.tags_window a#save_all_tags').click(function(ev){
	      stopPropagation(ev);
	      var old_values = [];
	      $("span.tags p").each(function(index,element){
	        old_values.push($(element).text());
	      });
	      var new_values = '';
	      $("span.tags p").remove();
	      $("span.tags span").remove();
	      $("li.tagit-choice").each(function(index,element){
	        var value = (($.trim($(element).text())).slice(0, -2));
	        $('<p>'+value+'</p>').insertBefore('span.tags a.add');
	        new_values+=value+',';
	      });

	      $("span.tags p:last").last().addClass('last');
	      $('span.tags_window').hide();
	      changesRequest('tags',new_values,old_values);
	    });
	
			return {}
		}());
		

    ///////////////////////////////////////
    //  Application tabs menu            //
    ///////////////////////////////////////
    $('section.subheader ul.tab_menu li a').click(function(ev){
      stopPropagation(ev);
      //closeOutTableWindows();
					//       if (!$(this).parent().hasClass('selected')) {
					//         if ($(this).text()=="Table") {
					// window.location.hash = "#table";
					//           $('section.subheader ul.tab_menu li').removeClass('selected');
					//           $(this).parent().addClass('selected');
					//           $(document).trigger('click');
					//           $('body').trigger('refresh');
					//           $('body').trigger('enabled',[true]);
					//					 $('body').attr('view_mode','table');
					//           $('div.general_options').removeClass('map').addClass('table');
					//           $('div.table_position').show();
					//           hideMap();
					//         } else {
					// window.location.hash = "#map";
					//           if (geolocating) {
					//             $('p.geo').trigger('click');
					//           } else {
					//             $('section.subheader ul.tab_menu li').removeClass('selected');
					//             $('div.general_options').removeClass('table end').addClass('map');
					//             $(this).parent().addClass('selected');
					//             $('div.table_position').hide();
					//						 $('body').attr('view_mode','map');
					//             $(document).trigger('click');
					//             $('body').trigger('enabled',[false]);
					//             showMap();
					//           }
					//         }
					//       }
    });
        
  });



	////////////////////////////////////////
  //  CLOSE OUT TABLE WINDOWS && ESC 	  //
  ////////////////////////////////////////
	// Send request to server about element out of the table
  function changesRequest(param,value,old_value) {
    var params = {};
    params[param] = value;

    var requestId = createUniqueId();
    params.requestId = requestId;
    requests_queue.newRequest(requestId,param);

    $.ajax({
      dataType: 'json',
      type: "PUT",
      url: global_api_url+'tables/'+table_name,
      data: params,
      headers: {'cartodbclient':true},
      success: function(data) {
        requests_queue.responseRequest(requestId,'ok','');
        if (param=="name") {
          table_name = value;
        }
      },
      error: function(e) {
        requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText));
        errorActionPerforming(param,old_value,$.parseJSON(e.responseText));
      }
    });
  }

	// If the request fails
  function errorActionPerforming(param, old_value,error_text) {
    switch (param) {
      case 'privacy': $('span.privacy_window ul li.'+old_value).addClass('selected');
                      $('p.status a').removeClass('public private').addClass(old_value).text(old_value);
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'name':    $('section.subheader h2 a').text(old_value.name);
                      if (old_value.status=="save") {
                        $('p.status a').removeClass('public private').addClass('save').text('save');
                      }
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'tags':    $("span.tags p").remove();
                      $.each(old_value,function(index,element){
                        $('<p>'+element+'</p>').insertBefore('a.add');
                      });
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      default:        break;
    }
  }



	////////////////////////////////////////
  //  CLOSE OUT TABLE WINDOWS && ESC 	  //
  ////////////////////////////////////////
  // Bind ESC key
	function bindESC() {
    $(document).keydown(function(event){
      if (event.which == '27') {
        closeOutTableWindows();
      }
    });
  }
  
  // Unind ESC key
  function unbindESC() {
    $(document).unbind('keydown');
    $('body').unbind('click');
  }

	// Close all elements out of the table
  function closeOutTableWindows() {
    $('span.privacy_window').hide();
    $('span.title_window').hide();
    $('span.advanced_options').hide();
    $('span.tags_window').hide();
		$('div.sql_window').hide()

    //popup windows
    $('div.mamufas').fadeOut('fast',function(){
      $('div.mamufas div.delete_window').hide();
      $('div.mamufas div.export_window').hide();
      $('div.mamufas div.save_window').hide();
      $('div.mamufas div.warning_window').hide();
      $('div.mamufas div.import_window').hide();
      $(document).unbind('keydown');
      $('body').unbind('click');
    });
  }
  


	////////////////////////////////////////
  //  CHANGE STATUS OF THE APP (SQL) 	  //
  ////////////////////////////////////////
  // Change application to SQL or normal mode
	function setAppStatus() {
		var query_mode = ($('body').attr('query_mode') === "true");
		if (query_mode) {
			$.favicon('/favicon/black_32x32.png');
			var html = $('p.settings').html();
			$('p.settings').html(html.replace(/\|/gi,''));
			$('body').addClass('query');
			$('body').animate({backgroundColor:'#282828'},500);
			setTimeout(function(){$('body').css('background-position','0 -160px');},300);
			$('section.subheader').animate({backgroundColor:'#282828'},500);
			setTimeout(function(){$('section.subheader').css('background-position','0 -218px');},300);
			$('span.advanced_options li:eq(0)').addClass('disabled');
		} else {
			$.favicon('/favicon/blue_32x32.png');
			$('body').removeClass('query');
			$('p.settings a:last').before(' | ');
			$('body').animate({backgroundColor:'#2D3451'},500);
			setTimeout(function(){$('body').css('background-position','0 0');},300);
			$('section.subheader').animate({backgroundColor:'#2D3451'},500);
			setTimeout(function(){$('section.subheader').css('background-position','0 -58px');},300);
			$('span.advanced_options li:eq(0)').removeClass('disabled');
		}
	}
  
  
  
  
  