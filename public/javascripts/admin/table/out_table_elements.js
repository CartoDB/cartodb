
  //SUBHEADER EVENTS AND FLOATING WINDOWS+//
  var editor,georeferencing;
  

  head(function(){
		
    
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
	          '<li class="map disabled"><a class="add_point">add point</a></li>'+
	          '<li class="map disabled"><a class="add_polygon">add polygon</a></li>'+
	          '<li class="map disabled"><a class="add_polyline">add line</a></li>'+
	          '<li class="map disabled"><a class="select_area">select area</a></li>'+
	          '<li class="map hidden edit"><a class="discard">discard</a></li>'+
	          '<li class="map hidden special edit"><a class="complete">complete</a></li>'+
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
						'<p>You can free move or close this window to watch the table. Protip: Ctrl+RETURN for lauching your query</p>'+
		        '<div class="outer_textarea"><textarea id="sql_textarea"></textarea></div>'+
		        '<span class="bottom">'+
		          '<span class="errors"><p>Your query is not correct, try again with another ;)</p></span>'+
		          '<a href="http://www.postgis.org/docs/" target="_blank" class="reference">PostGIS reference</a>'+
		          '<a href="#apply" class="try_query">Apply query</a>'+
		          '<a href="#clear" class="clear_table">Clear view</a>'+
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
	    $('div.sql_window').draggable({appendTo: 'body',containment:'parent'}).resizable({maxWidth:800,maxHeight:400});
			
			// Open sql console
			$('div.general_options a.sql, p a.open_console').livequery('click',function(ev){
			  stopPropagation(ev);
				if ($('div.sql_window').is(':visible')) {
					closeOutTableWindows();
				} else {
				  $('div.sql_window span.errors').hide();
				  
          if (editor.getValue()=='') {
            editor.setValue('SELECT * FROM ' + table_name);
          }
					$('div.sql_window').removeAttr('style');
	        $('div.sql_window').show();
					bindESC();
	        editor.focus();
				}
			});
			
			// Clear sql mode and back to normal state
			$('a.clear_table').livequery('click',function(ev){
			  closeOutTableWindows();
				var query_mode = ($('body').attr('query_mode') === "true");
			  if (query_mode) {
					$('body').attr('query_mode','false');
					setAppStatus();	// Out function to change app to SQL or NORMAL
			  }
			});
						
			$('div.sql_window a.close_sql,div.sql_window a.close').livequery('click',function(ev){
	    	stopPropagation(ev);
	      closeOutTableWindows();
	    });
			
			return {}
		}());



    ///////////////////////////////////////
    //  Bottom bar with tools (SQL,...)  //
    ///////////////////////////////////////
		var georeference_window = (function() {
			
			//Append georeference html to the document
			$('div.mamufas').append(
	      '<div class="georeference_window">'+
          '<a href="#close_window" class="close_geo"></a>'+
          '<div class="inner_">'+
            '<span class="loading">'+
               '<h5>We are georeferencing your columns...</h5>'+
               '<p>Just some seconds, ok?</p>'+
             '</span>'+
            '<span class="top">'+
              '<h3>Choose your geocoding method for this table</h3>'+
              '<p>Please select the columns for the lat/lon fields or choose/create an address column.</p>'+
							'<ul class="main_list">'+
								'<li class="first_list selected">'+
								  '<a class="first_ul" href="#lat_lng_column">This is a lat/lon column</a>'+
		              '<div class="georef_options">'+
		                '<div class="select longitude">'+
		                  '<label>LONGITUDE COLUMN</label>'+
		                  '<span class="select longitude">'+
		                    '<a id="longitude" class="option" href="#column_name" c="">Retrieving columns...</a>'+
		                    '<div class="select_content">'+
		                      '<ul class="scrollPane"></ul>'+
		                    '</div>'+
		                  '</span>'+
		                '</div>'+
				            '<div class="select latitude last">'+
		                  '<label>LATITUDE COLUMN</label>'+
		                  '<span class="select latitude">'+
		                    '<a id="latitude" class="option" href="#column_name" c="">Retrieving columns...</a>'+
		                    '<div class="select_content">'+
		                      '<ul class="scrollPane"></ul>'+
		                    '</div>'+
		                  '</span>'+
		                '</div>'+
		              '</div>'+
	              	'<div class="error_content"><p><span>You have to select latitude and longitude</span></p></div>'+
								'</li>'+
								'<li class="first_list">'+
									'<a class="first_ul" href="#choose_address">Choose or create an address column</a>'+
		              '<div class="georef_options">'+
										'<p class="info">Specify columns to use for geocoding by adding them within brackets. You can also add extra information to make your geocoding more accurate (eg. {school}, New York, USA)</p>'+
										'<input class="address_input" type="text" value=""/>'+
		              '</div>'+
								'</li>'+
							'</ul>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#confirm_georeference" class="confirm_georeference">Georeference</a>'+
            '</span>'+
          '</div>'+
        '</div>');


      
      // Now the listeners
			$('div.georeference_window ul.main_list li a.first_ul').click(function(ev){
				stopPropagation(ev);
				if (!$(this).closest('li').hasClass('selected') && !$(this).closest('li').hasClass('disabled')) {
					$('div.georeference_window ul.main_list li.first_list.selected').removeClass('selected');
					$(this).closest('li').addClass('selected');
				}
			});
      $('a.open_georeference,p.geo').livequery('click',function(ev){
        if (georeferencing) {
          stopPropagation(ev);
          closeOutTableWindows();
          $('div.mamufas div.stop_window h5').text('You are referencing by another column');
          $('div.mamufas div.stop_window p').html('If you don’t want to wait, <a href="#cancel_geo" class="cancel_geo">cancel the process</a> in progress');
          $('div.mamufas div.stop_window').show();
          $('div.mamufas').fadeIn('fast');
          bindESC();
        } else {
          var init_column = $(this).closest('th').attr('c') || '';

          // Remove selected list in header th
          $('thead tr th a.options').removeClass('selected');
          $('span.col_ops_list').hide();

          stopPropagation(ev);
          closeOutTableWindows();

          // SQL mode? you can't georeference
          var query_mode = ($('body').attr('query_mode') === "true");
      		if (!query_mode && !$(this).parent().hasClass('disabled')) {
      		  resetProperties();
  				  $('div.mamufas div.georeference_window').show();
    	      $('div.mamufas').fadeIn('fast');
    	      bindESC();

    	      // If this table is based on points/multipoint, you will be able to georeference
    	      checkGeomType();
  				}
        }

        
        function checkGeomType() {
          $.ajax({
            method: "GET",
            url: global_api_url+'queries?sql='+escape('SELECT type from geometry_columns where f_table_name = \''+table_name+'\' and f_geometry_column = \'the_geom\''),
            headers: {"cartodbclient":"true"},
            success: function(result) {
              var geom_type = result.rows[0].type.toLowerCase();
							$('div.mamufas div.georeference_window ul.main_list li').each(function(i,ele){$(ele).removeClass('selected disabled')});
              if (geom_type=="point" || geom_type=="multipoint") {
	              $('div.mamufas div.georeference_window ul.main_list li:eq(0)').addClass('selected');
								getColumns();
              } else {
								$('div.mamufas div.georeference_window ul.main_list li').addClass('disabled');
								$('div.georeference_window h3').text('Sorry, but you cannot georeference this table');
								$('div.georeference_window span.top p:eq(0)').text('You likely have it already georeferenced.');
              }							
            },            
            error: function(e){}
          });
        }

        function resetProperties() {
          $('div.mamufas div.georeference_window div.inner_ span.top').css('opacity',1).show();
          $('div.mamufas div.georeference_window div.inner_ span.bottom').css('opacity',1).show();
          
          $('div.mamufas div.georeference_window h3').text('Choose your geocoding method for this table');
          $('div.mamufas div.georeference_window span.top p:eq(0)').text('Please select the columns for the lat/lon fields or choose/create an address column.');

          $('div.mamufas div.georeference_window a.close_geo').show();
          $('div.mamufas div.georeference_window').css('height','auto');
          $('div.mamufas div.georeference_window div.inner_').css('height','auto');
          $('div.mamufas div.georeference_window').removeClass('loading');
          $('div.mamufas div.georeference_window input.address_input').val('');

          $('div.mamufas div.georeference_window span.select').each(function(i,ele){
            $(ele).addClass('disabled').removeClass('error');
          });
          
          $('div.mamufas div.georeference_window span.select a.option').each(function(i,ele){
            $(ele).text('Retrieving columns...').attr('c','');
          });
          $('div.mamufas div.georeference_window a.confirm_georeference').addClass('disabled');
          $('div.mamufas div.georeference_window span.select').removeClass('clicked');
          $('div.mamufas div.georeference_window').css('overflow','visible');


          // Remove all ScrollPane and lists items //
          var custom_scrolls = [];
          $('div.mamufas div.georeference_window .scrollPane').each(function(){
       		  custom_scrolls.push($(this).jScrollPane().data().jsp);
       		});

          _.each(custom_scrolls,function(ele,i) {
            ele.destroy();
          });
          $('div.mamufas div.georeference_window span.select ul li').remove();
        }

        function getColumns() {
          $.ajax({
            method: "GET",
            url: global_api_url + 'tables/' + table_name,
      			headers: {"cartodbclient":"true"},
            success: function(data) {
              data = data.schema;

              for (var i = 0; i<data.length; i++) {
                if (data[i][0]!="cartodb_id" && data[i][0]!="created_at" && data[i][0]!="updated_at") {
	
                   if (data[i][2]==undefined) {
                     $('div.georeference_window span.select ul').append('<li><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                   } else {
                     $('div.georeference_window div.block span.select ul').append('<li><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                     if (data[i][2]=="longitude") {
                       $('div.georeference_window span.select:eq(1) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                       $('div.georeference_window span.select:eq(0) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                       $('div.georeference_window span.select:eq(1) a.option').text(data[i][0]).attr('c',data[i][0]);
                     } else if (data[i][2]=="latitude") {
                       $('div.georeference_window span.select:eq(1) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                       $('div.georeference_window span.select:eq(0) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                       $('div.georeference_window span.select:eq(0) a.option').text(data[i][0]).attr('c',data[i][0]);
                     }
                   }
                 }
               }

               // If the list is empty...
               if ($('div.georeference_window span.select:eq(1) ul li').size()==0) {
                 $('div.georeference_window span.select:eq(1) ul').append('<li class="empty">Empty</li>');
                 $('div.georeference_window span.select:eq(0) ul').append('<li class="empty">Empty</li>');
               } else {
                 // If it comes from one column...
                 if (init_column != '') {
                   $('a#longitude').text(init_column);
                   $('a#longitude').attr('c',init_column);
									 $('div.georeference_window div.georef_options input.address_input').val('{'+init_column+'}');
                 }                   
               }

               $('div.georeference_window span.select').removeClass('disabled');
               $('div.georeference_window span.select a.option').each(function(i,ele){
                 if ($(ele).text()=="Retrieving columns...") {
                    $(ele).text('Select a column').attr('c','');
                  }
               });
               $('div.georeference_window a.confirm_georeference').removeClass('disabled');
             },
             error: function(e) {
               $('div.georeference_window span.select:eq(0) a:eq(0)').text('Error retrieving cols').attr('c','');
               $('div.georeference_window span.select:eq(1) a:eq(0)').text('Error retrieving cols').attr('c','');
             }
          });
        }
      });
      $('div.georeference_window span.select a.option').livequery('click',function(ev){
        stopPropagation(ev);
        if (!$(this).parent().hasClass('disabled')) {
          if ($(this).parent().hasClass('clicked')) {
            $(this).parent().removeClass('clicked');
          } else {
            $('div.georeference_window span.select').removeClass('clicked');
            $('body').bind('click',function(ev){
              if (!$(ev.target).closest('span.select').length) {
                $('div.georeference_window > span.select').removeClass('clicked');
              }
            });
            $(this).parent().addClass('clicked');
            $(this).parent().find('ul').jScrollPane();
          }
        }
      });
      $('div.georeference_window div.select_content ul li a').livequery('click',function(ev){
        stopPropagation(ev);
				if (!$(this).parent().hasClass('selected')) {
					$(this).closest('span.select').children('a.option').text($(this).text());
	        $(this).closest('span.select').children('a.option').attr('c',$(this).text());
					$(this).closest('ul').find('li.selected').removeClass('selected');
					$(this).parent().addClass('selected')
					
	        $('span.select').removeClass('clicked');

					var type = $(this).closest('span.select');

					$(this).parent().parent().children('li').removeClass('choosen');
	        $(this).parent().addClass('choosen');
	        var index = ($(this).closest('span.select').hasClass('latitude'))?0:1;
	        if (index == 0) {
	          var other_index = 1;
	          var other_value = $('span.select:eq(1) a.option').text();
	        } else {
	          var other_index = 0;
	          var other_value = $('span.select:eq(0) a.option').text();
	        }
	        $('span.select:eq('+index+') ul li a:contains("'+other_value+'")').parent().addClass('choosen');
	        $('span.select:eq('+other_index+') ul li').removeClass('choosen');
	        $('span.select:eq('+other_index+') ul li a:contains("'+other_value+'")').parent().addClass('choosen');
	        $('span.select:eq('+other_index+') ul li a:contains("'+$(this).text()+'")').parent().addClass('choosen');
				} else {
					$('span.select').removeClass('clicked');
				}


      });
      $('a.confirm_georeference').livequery('click',function(ev){
        stopPropagation(ev);

        if (!$(this).hasClass('disabled')) {
	
					// LAT|LON OR ADDRESS
					if ($('div.georeference_window ul.main_list li.selected').index()==0) {
						var latitude = $('a#latitude').attr('c');
	          var longitude = $('a#longitude').attr('c');
	          if (!(latitude=='' && longitude=='')) {
	            var params = {};
	            params['latitude_column'] = latitude;
	            params['longitude_column'] = longitude;
	            params['_method'] = "PUT"

	            var requestId = createUniqueId();
	            requests_queue.newRequest(requestId,'update_geometry');

	            $.ajax({                
	                type: "POST",
	                dataType: 'json',
	                url: global_api_url+'tables/'+ table_name,
	                data: params,
	                headers: {'cartodbclient':true},                                
	                success: function(data) {
	                  requests_queue.responseRequest(requestId,'ok','');
	                  successActionPerforming('update_geometry',null,null);
	                },
	                error: function(e) {
	                  requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors);
	                  errorActionPerforming('update_geometry',null,$.parseJSON(e.responseText).errors);
	                }
	            });

	            loadingState();
	          } else {
	            if (latitude=='') {
	              $('span.select.latitude').addClass('error');
	            }
	            if (longitude=='') {
	              $('span.select.longitude').addClass('error');              
	            }
	            $('div.georeference_window div.error_content').fadeIn().delay(3000).fadeOut();
	          }
					} else {
						new Geocoding($('div.georeference_window div.georef_options input.address_input').val(),'addresses');
						closeOutTableWindows();
					}
	

        }


        function loadingState() {
          unbindESC();
          $('div.georeference_window').css('overflow','hidden');
          $('div.georeference_window div.inner_ span.top').animate({opacity:0},200,function(){
            $(this).hide();
            $('div.georeference_window a.close_geo').hide();
            $('div.georeference_window span.loading').css('opacity','0');
            $('div.georeference_window').addClass('loading');
            $('div.georeference_window div.inner_ span.loading').animate({opacity:1},200);
          });
          $('div.georeference_window div.inner_ span.bottom').animate({opacity:0},200,function(){
            $(this).hide();
          });
          $('div.georeference_window div.inner_').animate({height:'74px'},400);
        }
      });
      $('div.georeference_window a.close_geo,div.georeference_window a.cancel').livequery('click',function(ev){
        stopPropagation(ev);
        closeOutTableWindows();
        unbindESC();
      });
			$('div.stop_window p a.cancel_geo').livequery('click',function(ev){
			  stopPropagation(ev);
			  closeOutTableWindows();
			  $(window).trigger('stopGeo');
			});
			
			return {}
		}());
    
    

	  ///////////////////////////////////////
    //  Advanced options                 //
    ///////////////////////////////////////
		var advanced_options = (function() {
		  
		  $('div.mamufas').append(
		    '<div class="save_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="loading">'+
              '<h5>We are duplicating your table...</h5>'+
              '<p>Just some seconds, ok?</p>'+
            '</span>'+
            '<span class="top">'+
              '<h3>Insert a name for your copy of this table</h3>'+
              '<input type="text"/>'+
              '<div class="error_content"><p><span>Provide a name for your new table</span></p></div>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#save_table" class="table_save" >Save table</a>'+
            '</span>'+
          '</div>'+
        '</div>'
		  );
			
			$('div.inner_subheader div.right').append(
	      '<span class="advanced_options">'+
	        '<a href="#close_advanced_options" class="advanced">advanced<span></span></a>'+
	        '<ul>'+
	          '<li class="disabled"><a class="import_data">Import data...</a></li>'+
	          '<li><a class="export_data">Export data...</a></li>'+
	          '<li><a class="save_table">Duplicate table as...</a></li>'+
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
	      resetSaveWindow();
        closeOutTableWindows();
        $('div.mamufas div.save_window').show();
        $('div.mamufas').fadeIn('fast');
        $('div.save_window span.top input').focus();
        
        $(document).keydown(function(event){
          if (event.which == '13') {
            $('a.table_save').click();
            unbindESC();
          }
        });

        bindESC();
	    });

	    $('a.table_save').click(function(ev){
	      stopPropagation(ev);
	      unbindESC();
	      var new_table = $('div.save_window span.top input').val();
	      
	      if (new_table!="") {
	        $('div.save_window span.top input').removeClass('error');
	        loadingState();
	        
	        // Send request, only if there is an error...
	        var requestId = createUniqueId();
          requests_queue.newRequest(requestId,'duplicate_table');
	        
	        $.ajax({
            type: "POST",
            url: global_api_url+'tables',
            data: {
              name: new_table,
              table_copy: table_name
            },
            headers: {"cartodbclient":"true"},
            success: function(result) {
              window.location.href = '/tables/'+ result.name;
            },
            error: function(e) {
              closeOutTableWindows();
              requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).message);
            }
          });
	      } else {
	        $('div.save_window span.top input').addClass('error');
	        $('div.save_window span.top div.error_content').fadeIn().delay(3000).fadeOut();
	      }
	      

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
			
			
			function resetSaveWindow() {
			  $('div.save_window').css('overflow','visible');
        $('div.save_window div.inner_ span.top').css({opacity:1,display:'block'});
        $('div.save_window a.close').show();
        $('div.save_window').removeClass('loading');
        $('div.save_window div.inner_ span.loading').css({opacity:0});
        $('div.save_window div.inner_ span.bottom').css({opacity:1,display:'block'});
        $('div.save_window div.inner_').css({height:'auto'});
        $('div.save_window span.top input').val('');
			}
			
			
		  function loadingState() {
        unbindESC();
        $('div.save_window').css('overflow','hidden');
        $('div.save_window div.inner_ span.top').animate({opacity:0},200,function(){
          $(this).hide();
          $('div.save_window a.close').hide();
          $('div.save_window span.loading').css('opacity','0');
          $('div.save_window').addClass('loading');
          $('div.save_window div.inner_ span.loading').animate({opacity:1},200);
        });
        $('div.save_window div.inner_ span.bottom').animate({opacity:0},200,function(){
          $(this).hide();
        });
        $('div.save_window div.inner_').animate({height:'74px'},400);
      }
			
			
			return {}
		}());
		
		

    ///////////////////////////////////////
    //  Delete window                    //
    ///////////////////////////////////////
		var delete_table = (function() {
		  
		  $('div.mamufas').append(
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
        '</div>'
		  );
		  
		  
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
	      closeOutTableWindows();
	    });
	
	    $('a.confirm_delete').click(function(ev){
        ev.preventDefault();
	      ev.stopPropagation();
	      $.ajax({
	        type: "DELETE",
	        url: global_api_url+'tables/'+table_name,
	        dataType: "text",
	        headers: {'cartodbclient':true},
	        success: function(data, textStatus, XMLHttpRequest) {
						$.cookie('flash', 'Table successfully removed');
	          window.location.href = '/dashboard';
	        },
	        error: function(e) {}
	      });
	    });
	
			return {}
		}());



    ///////////////////////////////////////
    //  Export window                    //
    ///////////////////////////////////////
		var export_table = (function() {
		  
		  $('div.mamufas').append(
		    '<div class="export_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<form action="/tables/'+ table_name +'" method="get">'+
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
        '</div>'
		  );
			
	    $('div.mamufas div.export_window form a.option').click(function(ev){
	      stopPropagation(ev);
				if (!$(this).parent().hasClass('disabled')) {
					var format = $(this).attr('rel');
		      $('div.mamufas div.export_window form ul li').removeClass('selected');
		      $(this).parent().addClass('selected');
		      $('#export_format').val(format);
				}
	    });
	    
	    $('div.mamufas div.export_window a.close,div.mamufas div.export_window a.cancel').click(function(ev){
	      stopPropagation(ev);
	      closeOutTableWindows();
	    });
	
	    $('div.mamufas div.export_window form').submit(function(ev){
	      closeOutTableWindows();
	    });
	
	    $('#export_format').val($('div.mamufas div.export_window form ul li.selected a.option').attr('rel'));
	
			return {}
		}());



    ///////////////////////////////////////
    //  Change title name window         //
    ///////////////////////////////////////
		var title_name = (function() {
		  
		  // Warning window
		  $('div.mamufas').append(
        '<div class="warning_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<form>'+
              '<span class="top">'+
                '<h3>This change will affect your API calls</h3>'+
                '<p>If you are accesing to this table via API don’t forget to update the name in the API calls after changing the name.</p>'+
              '</span>'+
              '<span class="bottom">'+
                '<a href="#close_window" class="cancel">cancel</a>'+
                '<input type="submit" class="continue" value="Ok, continue"/>'+
              '</span>'+
            '</form>'+
          '</div>'+
        '</div>');
        
			// Title window
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
	        // If the name of the table is Untitled_table... - not show warning
	        if ((old_value.name).search('untitled_table')==-1) {
	          closeOutTableWindows();
	          $('div.mamufas div.warning_window form').unbind('submit');
	          $('div.mamufas div.warning_window form').submit(function(ev){
	            stopPropagation(ev);
	            changeTableName(new_value,old_value);
	          });
	          $('div.mamufas div.warning_window').show();
	          $('div.mamufas').fadeIn('fast',function(){
	            $('div.mamufas div.warning_window input').focus();
	          });
	          bindESC();
	        } else {
	          changeTableName(new_value,old_value);
	        }
        
	        // Function to change the table name final steps

	      }
	    });
	
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

			return {}
		}());



    ///////////////////////////////////////
    //  Change table status              //
    ///////////////////////////////////////
		var table_status = (function() {
	    $('div.inner_subheader div.left').append(
	      '<span class="privacy_window">'+
	        '<ul>'+
	          '<li class="public '+((status=="public")?'selected':'')+'"><a href="#"><strong>Public</strong> (visible to others)</a></li>'+
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
	          
	          if (new_value=='public') {
	            $('ul.tab_menu li a.share').removeClass('disabled');
	          } else {
	            $('ul.tab_menu li a.share').addClass('disabled');
	          }
	          
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
	      $('input.tagit-input').focus();
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
	      
	      // Get last input value if it isn't empty
	      var last_input = $('input.tagit-input').val();
	      if (last_input.length>0) {
		    	$('<p>'+last_input+'</p>').insertBefore('span.tags a.add');
	      	new_values+=last_input;
	      }
	      

	      $("span.tags p:last").last().addClass('last');
	      $('span.tags_window').hide();
	      changesRequest('tags',new_values,old_values);
	    });
	
			return {}
		}());
		


    ///////////////////////////////////////
    //  Share embed map                  //
    ///////////////////////////////////////
		var embed_window = (function() {
		  var embed_map;
		  var embedOptions = {
        zoom: 2,
        center: new google.maps.LatLng(0,0),
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
		  
		  //Append georeference html to the document
			$('div.mamufas').append(
	      '<div class="embed_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>Embed this map in your website</h3>'+
              '<p>It’s just copy and paste!</p>'+
              '<div class="html_code">'+
                '<h4>HTML CODE</h4>'+
                '<span class="copy_code">'+
                  '<input type="text" disabled="disabled" value="<iframe src=\'http://'+user_name+'.cartodb.com/tables/'+table_name+'/embed_map\' width=\'572\' height=\'220\'></iframe>" />'+
                  '<a id="test" class="copy">Copy</a>'+
                '</span>'+
                '<span class="outer_map">'+
                  '<div id="embed_map" class="embed_map"></div>'+
                  '<a href="#zoom_in" class="embed_zoom_in">+</a>'+
                  '<a href="#zoom_out" class="embed_zoom_out">-</a>'+
                  '<a href="http://cartodb.com" class="cartodb_logo" target="_blank">CartoDB</a>'+
                '</span>'+
              '</div>'+
              '<div class="tiles_code">'+
                '<h4>OR TILES URL</h4>'+
                '<span class="copy_code">'+
                  '<input type="text" disabled="disabled" value="'+TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/{z}/{x}/{y}'+'.png'+'" />'+
                  '<a class="copy">Copy</a>'+
                '</span>'+
              '</div>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">Close</a>'+
            '</span>'+
          '</div>'+
        '</div>');
		  

		  // Bindings
		  $('ul.tab_menu li a.share').livequery('click',function(ev){
		    stopPropagation(ev);		    
				if ($(this).hasClass('disabled')) {return false}				
				closeOutTableWindows();
				
		    
		    // Change values of the inputs

	      $('div.embed_window').show();
	      $('div.mamufas').fadeIn('fast',function(){
	        if (!embed_map)
	          createMap();
	        toggleLayer();
	        addCustomStyles();
	        
	        // Start zclip
	        $("div.embed_window .inner_ span.top div span a.copy").zclip({
            path: "/javascripts/plugins/ZeroClipboard.swf",
            copy: function(){
							$(this).parent().find('input').select();
              return $(this).parent().find('input').val();
            }
          });
	      });
	      bindESC();
		  });
		  
			//	show embed tooltip
			$('ul.tab_menu li a.share').click(function(ev){
				ev.preventDefault();
				if ($(this).hasClass('disabled')) 
					$(this).parent().find('span.share_tooltip').show();
			});
			
			$('ul.tab_menu li').mouseleave(function() {
				if ($(this).find('span.share_tooltip').length>0) {
					$(this).parent().find('span.share_tooltip').fadeOut();
				}
			});
		
			$('ul.tab_menu li span.share_tooltip p a').click(function(ev){
				ev.preventDefault();
				$('span.privacy_window ul li.public a').click();
				$(this).closest('li').find('span.share_tooltip').hide();
			});
		
		
		  // Close embed
		  $('div.embed_window a.close, div.embed_window a.cancel').click(function(ev){
		    stopPropagation(ev);
		    closeOutTableWindows();
		    $("div.embed_window .inner_ span.top div span a.copy").zclip('remove');
		    unbindESC();
		  });
		  
		  // Zooms
		  $('a.embed_zoom_in').click(function(ev){
        ev.preventDefault();
        embed_map.setZoom(embed_map.getZoom()+1);
      });
      $('a.embed_zoom_out').click(function(ev){
        ev.preventDefault();
        embed_map.setZoom(embed_map.getZoom()-1);
      });
		  
		  function createMap() {
		    embed_map = new google.maps.Map(document.getElementById("embed_map"),embedOptions);
		  }
		  
		  function toggleLayer() {
		    // Remove previous layers
		    if (embed_map!=null)
		      embed_map.overlayMapTypes.clear();
		    
	      var cartodb_layer = {
          getTileUrl: function(coord, zoom) {
            return TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/'+zoom+'/'+coord.x+'/'+coord.y+'.png';
          },
          tileSize: new google.maps.Size(256, 256)
        };
        var cartodb_imagemaptype = new google.maps.ImageMapType(cartodb_layer);
        embed_map.overlayMapTypes.insertAt(0, cartodb_imagemaptype);
		  }
		  
		  function addCustomStyles() {
		    $.ajax({
          url: global_api_url + 'tables/' + table_id + '/map_metadata',
          type: "GET",
          dataType: 'jsonp',
          headers: {"cartodbclient":"true"},
          success:function(result){
            map_style = $.parseJSON(result.map_metadata);
						if (map_style!=null) {
							if (map_style.google_maps_base_type=="satellite") {
	              embed_map.setOptions({mapTypeId: google.maps.MapTypeId.SATELLITE});
	            } else if (map_style.google_maps_base_type=="terrain") {
	              embed_map.setOptions({mapTypeId: google.maps.MapTypeId.TERRAIN});
	            } else {
	              embed_map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
	            }
	
							if (map_style.zoom && map_style.longitude && map_style.latitude) {
                embed_map.setZoom(map_style.zoom);
                embed_map.setCenter(new google.maps.LatLng(map_style.latitude,map_style.longitude));
              } else {
                zoomToBBox();
              }
							
						} else {
							zoomToBBox();
							embed_map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
							map_style = {};
							map_style.google_maps_customization_style = [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] }, { featureType: "administrative", stylers: [ { saturation: -95 },{ gamma: 2.26 } ] }, { featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "administrative.locality", stylers: [ { visibility: 'off' } ] }, { featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] }, { featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "road.arterial", stylers: [ { visibility: 'off' } ] }, { featureType: "road.local", elementType: "labels", stylers: [ { visibility: 'off' } ] }, { featureType: "transit", stylers: [ { visibility: 'off' } ] }, { featureType: "road", elementType: "labels", stylers: [ { visibility: 'off' } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];
						}
            
            // Custom tiles
            embed_map.setOptions({styles: map_style.google_maps_customization_style})
          },
          error: function(e){
             console.debug(e);
          }
        });
		  }
		  
		  function zoomToBBox() {
        var me = this;
        $.ajax({
            method: "GET",
            url: global_api_url+'queries?sql='+escape('select ST_Extent(the_geom) from '+ table_name),
            headers: {"cartodbclient":"true"},
            success: function(data) {
              if (data.rows[0].st_extent!=null) {
                var coordinates = data.rows[0].st_extent.replace('BOX(','').replace(')','').split(',');

                var coor1 = coordinates[0].split(' ');
                var coor2 = coordinates[1].split(' ');
                var bounds = new google.maps.LatLngBounds();
                
                // Check bounds
                if (coor1[0] >  180 
                 || coor1[0] < -180 
                 || coor1[1] >  90 
                 || coor1[1] < -90 
                 || coor2[0] >  180 
                 || coor2[0] < -180 
                 || coor2[1] >  90  
                 || coor2[1] < -90) {
                  coor1[0] = '-30';
                  coor1[1] = '-50'; 
                  coor2[0] = '110'; 
                  coor2[1] =  '80'; 
                }

                bounds.extend(new google.maps.LatLng(coor1[1],coor1[0]));
                bounds.extend(new google.maps.LatLng(coor2[1],coor2[0]));

                embed_map.fitBounds(bounds);
              }

            },
            error: function(e) {
            }
        });
      }
		  
		  return {}
		}());



    ///////////////////////////////////////
    //  Stop window                      //
    ///////////////////////////////////////
    var stop_window = (function() {
      
      $('div.mamufas').append(
        '<div class="stop_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="stop">'+
              '<h5>Sorry, this geometry is too big to edit in browser</h5>'+
              '<p>We\'re working on ways to improve this, but in the meantime you can edit the geometry via our API.</p>'+
            '</span>'+
          '</div>'+
        '</div>');
        
      $('div.mamufas div.stop_window a.close').click(function(ev){
        stopPropagation(ev);
	      closeOutTableWindows();
	    });

      return {}
	  }());



    ///////////////////////////////////////
    //  Application tabs menu            //
    ///////////////////////////////////////
    $('section.subheader ul.tab_menu li a').click(function(ev){
      if (!$(this).parent().hasClass('selected') && !$(this).parent().hasClass('disabled')) {
				if ($(this).text()=="Table") {
					stopPropagation(ev);
	        closeOutTableWindows();
					$.History.go('/table');
				} else if ($(this).text()=="Map"){
					stopPropagation(ev);
	        closeOutTableWindows();
					$.History.go('/map');
				}
      } else {
        stopPropagation(ev);
      }
    });
  });


	////////////////////////////////////////
  //  CHANGE APP STATE				       	  //
  ////////////////////////////////////////
	function goToMap() {
		$('span.paginate').hide();
		 					
		// Change list and tools selected
    $('section.subheader ul.tab_menu li').removeClass('selected');
    $('div.general_options').removeClass('table end').addClass('map');
    $('section.subheader ul.tab_menu li a:contains("Map")').parent().addClass('selected');
    
    // Disable the table
		$('table').cartoDBtable('disableTable');
    
    // Show map
    $('div.table_position').hide();
		$('body').attr('view_mode','map');
    showMap();
	}
	
	function goToTable() {
		$('span.paginate').show();
		
		// Change list and tools selected
    $('section.subheader ul.tab_menu li').removeClass('selected');
    $('div.general_options').removeClass('map').addClass('table');
    $('section.subheader ul.tab_menu li a:contains("Table")').parent().addClass('selected');
    
    // Refresh & show the table
    $('table').cartoDBtable('refreshTable');
    
    // Hide map
		$('body').attr('view_mode','table');
    $('div.table_position').show();
    if (carto_map) {hideMap()}
	}



	////////////////////////////////////////
  //  REQUEST OUT OF THE TABLE       	  //
  ////////////////////////////////////////
	// Send request to server about element out of the table
  function changesRequest(param,value,old_value,table_id) {
    var params = {};
    params[param] = value;

    var requestId = createUniqueId();
    params.requestId = requestId;
    requests_queue.newRequest(requestId,param);

    $.ajax({
      dataType: 'json',
      type: "PUT",
      url: global_api_url+'tables/'+ table_name,
      data: params,
      headers: {'cartodbclient':true},
      success: function(data) {
        requests_queue.responseRequest(requestId,'ok','');
        successActionPerforming(param,value,old_value);
      },
      error: function(e) {
        requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText));
        errorActionPerforming(param,old_value,$.parseJSON(e.responseText));
      }
    });
  }
  
  // If the request is ok
  function successActionPerforming(param,new_value,old_value) {
    switch (param) {
      case 'update_geometry': $('table').cartoDBtable('refreshTable');
                              closeOutTableWindows();
                              break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'name':            table_name = new_value;
                              // Refresh tiles to get the new urls
                              if (carto_map) carto_map.refresh();
                              break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      default:                break;
    }
  }

	// If the request fails
  function errorActionPerforming(param, old_value,error_text) {
    switch (param) {
      case 'update_geometry': closeOutTableWindows();
                              break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'privacy': $('span.privacy_window ul li.'+old_value).addClass('selected');
                      $('p.status a').removeClass('public private').addClass(old_value).text(old_value);
                      if (old_value=='public') {
          	            $('ul.tab_menu li a.share').removeClass('disabled');
          	          } else {
          	            $('ul.tab_menu li a.share').addClass('disabled');
          	          }
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
		$('div.sql_window').hide();
		$("div.embed_window .inner_ span.top div span a.copy").zclip('remove');

    //popup windows
    $('div.mamufas').fadeOut('fast',function(){
      $('div.mamufas div.delete_window').hide();
      $('div.mamufas div.export_window').hide();
      $('div.mamufas div.save_window').hide();
      $('div.mamufas div.warning_window').hide();
      $('div.mamufas div.import_window').hide();
      $('div.mamufas div.georeference_window').hide();
      $('div.mamufas div.embed_window').hide();
      $('div.mamufas div.stop_window').hide();
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
			$('ul.tab_menu li a.share').hide();
		  $('a.open_georeference').css({opacity:0.5});
			$.favicon('/favicon/black_32x32.png');
			var html = $('p.settings').html();
			$('p.settings').html(html.replace(/\|/gi,''));
			$('body').addClass('query');
			$('body').animate({backgroundColor:'#282828'},500);
			setTimeout(function(){$('body').css('background-position','0 -160px');},300);
			$('section.subheader').animate({backgroundColor:'#282828'},500);
			setTimeout(function(){$('section.subheader').css('background-position','0 -218px');},300);
		} else {
			$('ul.tab_menu li a.share').show();
		  $('a.open_georeference').css({opacity:1});
			$.favicon('/favicon/blue_32x32.png');
			$('body').removeClass('query');
			$('p.settings a:last').before(' | ');
			$('p.settings a:eq(1)').before(' | ');
			$('body').animate({backgroundColor:'#2D3451'},500);
			setTimeout(function(){$('body').css('background-position','0 0');},300);
			$('section.subheader').animate({backgroundColor:'#2D3451'},500);
			setTimeout(function(){$('section.subheader').css('background-position','0 -58px');},300);
		}
	}
  
  
  
  
  