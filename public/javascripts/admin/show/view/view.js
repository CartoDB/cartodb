
  //SUBHEADER EVENTS AND FLOATING WINDOWS+//
  var editor,georeferencing;
  

  function initView(){

  	// Inits loader queue
		window.ops_queue = new loaderQueue();
    
    // Initialize cartodb-view
    window.view = {};


    ///////////////////////////////////////
    //  Bottom bar with tools (SQL,...)  //
    ///////////////////////////////////////
		var general_options = (function() {
			
			//Append general options to document
			$('body').append(window.view_elements.general_options + window.view_elements.sql_editor);

			/*******************/
			/* Event listeners */
	    /*******************/

	    // Draggable and resizable capacities to sql window
	    $('div.sql_window').draggable({
	      appendTo: 'body',
	      containment: 'parent',
	      handle: 'h3'
	    }).resizable({
	      maxWidth: 800,
	      maxHeight: 400
	    });

	    // Open sql console
	    $('div.general_options a.sql, p a.open_console').live('click', function (ev) {
	      stopPropagation(ev);
	      if ($('div.sql_window').is(':visible')) {
	        closeOutTableWindows();
	      } else {
	        if (editor.getValue() == '') {
	          editor.setValue('SELECT * FROM ' + table_name);
	        }
	        
	        $('div.sql_window').fadeIn('fast', function () {
	          editor.refresh();
	          editor.focus();
	        });

	        // Set errors size if exists
	        if (editor.errors) {
	        	$('div.sql_window div.inner div.outer_textarea').css({bottom:$('div.sql_window span.errors').outerHeight() +'px'});
	        } else {
	        	$('div.sql_window div.inner div.outer_textarea').removeAttr('style');
	        }

	        bindESC();
	      }
	    });

	    // Close all the windows
	    $('a.clear_table').live('click', function (ev) {
	      closeOutTableWindows();
	    });
	    
	    $('div.sql_window a.close_sql,div.sql_window a.close').live('click', function (ev) {
	      stopPropagation(ev);
	      closeOutTableWindows();
	      if (editor.errors) {
	      	delete editor['errors'];
	      	$('a.clear_table:eq(0)').click();
	      }
	    });

	    // SQL editor
	    editor = CodeMirror.fromTextArea(document.getElementById("sql_textarea"), {
	      lineNumbers: false,
	      mode: "text/x-plsql",
	      lineWrapping: true,
	      onKeyEvent: function (editor, event) {
	        if (event.altKey && event.keyCode == 13 && event.type == "keydown") {
	          stopPropagation(event);
	          $('div.sql_window a.try_query').trigger('click');
	        }
	      }
	    });

	    editor.historyArray = new Array();
	    editor.historyArray.push('SELECT * FROM ' + table_name);
	    editor.historyIndex = 0;


	    // UNDO - REDO
	    $('div.sql_window span.history a.undo').on('click', function (ev) {
	      stopPropagation(ev);
	      if ($(this).hasClass('active') && editor.historyIndex>0 && editor.historyArray.length>0) {
	      	editor.historyIndex--;
					editor.setValue(editor.historyArray[editor.historyIndex]);

					if (editor.historyIndex < 1)
						$(this).removeClass('active');

					$('div.sql_window span.history a.redo').addClass('active');
		    }
	    });

	    $('div.sql_window span.history a.redo').on('click', function (ev) {
	      stopPropagation(ev);
	      if ($(this).hasClass('active') && editor.historyIndex<editor.historyArray.length - 1) {
	      	editor.historyIndex++;
	      	editor.setValue(editor.historyArray[editor.historyIndex]);

	      	if (editor.historyIndex == (editor.historyArray.length - 1)) 
	      		$(this).removeClass('active');

					$('div.sql_window span.history a.undo').addClass('active');
		    }
	    });

	    $('div.sql_window a.redo,div.sql_window a.undo').hover(
		    function(){
		    	var position = $(this).position().left;
	    		$(this)
	    			.closest('span.history')
	    			.find('div.tooltip p')
	    			.text($(this).attr('class').replace('active',''))
	    			.parent()
	    			.css({left: position - 10 + 'px'})
	    			.show();
	    	},
	    	function() {
	    		$(this).closest('span.history').find('div.tooltip').hide();
	    	}
	    );
	    

	    editor.addHistory = function() {
	    	var sql = editor.getValue();

	    	if (editor.historyArray[editor.historyIndex] != sql) {
	    		// Size bigger than 10?
		    	if (editor.historyArray.length>=10) {
		    		editor.historyArray.shift();
		    	} else {
		    		editor.historyIndex++;
		    		editor.historyArray = editor.historyArray.slice(0,editor.historyIndex);
		    	}
		    	editor.historyArray.push(sql);

		    	// Check undo and redo activation
		    	if ((editor.historyIndex + 1) == (editor.historyArray.length)) {
		      	$('div.sql_window a.redo').removeClass('active');
		      } else {
		      	$('div.sql_window a.redo').addClass('active');
		      }

		      if (editor.historyIndex < 0) {
						$('div.sql_window a.undo').removeClass('active');
					} else {
						$('div.sql_window a.undo').addClass('active');
					}
	    	}
	    }

			
			return {}
		}());



    ///////////////////////////////////////
    //  Bottom bar with tools (SQL,...)  //
    ///////////////////////////////////////
		var georeference_window = (function() {
			
			//Append georeference html to the document
			$('div.mamufas').append(window.view_elements.geo_window);

      // Now the listeners
			$('div.georeference_window ul.main_list li a.first_ul').click(function(ev){
				stopPropagation(ev);
				if (!$(this).closest('li').hasClass('selected') && !$(this).closest('li').hasClass('disabled')) {
					$('div.georeference_window ul.main_list li.first_list.selected').removeClass('selected');
					$(this).closest('li').addClass('selected');
				}
			});
      $('a.open_georeference,p.geo').live('click',function(ev){
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
          var query_mode = ($('body').hasClass('query'));
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
					// autocomplete stuff
					availableColumns = [];
					$("div.georeference_window p.hack").text('');
					
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
		
									if (data[i][0]!="the_geom" && data[i][0]!="cartodb_georef_status") {
										availableColumns.push('{' + data[i][0] + '}');
									}
	
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
                   // Select the init column
                   $('a#longitude')
                   	.parent()
                   	.find('div.select_content li a')
                   	.filter(function(){
                   		return $(this).text() == init_column;
                   	})
                   	.parent().addClass('selected');
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


			// AUTOCOMPLETE STUFF
			var availableColumns = [],
					position = 0;
			
			function split( val ) {
				return val.split( /,\s*| \s*/ );
			}
			function extractLast( term ) {
				return split( term ).pop();
			}

			$( "div.georeference_window input.address_input")
				.bind( "keydown", function( event ) {
					if ( event.keyCode === $.ui.keyCode.TAB && $( this ).data( "autocomplete" ).menu.active ) {
						event.preventDefault();
					}
					if (event.keyCode == 32 || event.keyCode == 188 || event.keyCode == 13 || event.keyCode == $.ui.keyCode.TAB || event.keyCode == 74 || event.keyCode == 8) {
						var i_h = $("div.georeference_window p.hack");
						var text = $(this).val().substr(0,$(this).caret().end);
						i_h.text(text);
						position = Math.min(i_h.width() + 10, 180);
					}
				})
				.autocomplete({
					autoFocus: true,
					minLength: 1,
					source: function( request, response ) {
						response($.ui.autocomplete.filter(availableColumns, extractLast(request.term)));
						var l_ = parseInt($(this.menu.element).css('left').replace('px',''));
						$(this.menu.element).css({left:position + l_ + 'px'});
					},
					focus: function() {
						return false;
					},
					select: function( event, ui ) {
						var terms = split( this.value );
						terms.pop();
						terms.push( ui.item.value );
						terms.push( "" );
						this.value = terms.join(" ");
						return false;
					}
				});

      $('div.georeference_window span.select a.option').live('click',function(ev){
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
      $('div.georeference_window div.select_content ul li a').live('click',function(ev){
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
      $('a.confirm_georeference').live('click',function(ev){
        stopPropagation(ev);

        if (!$(this).hasClass('disabled')) {
					// LAT|LON OR ADDRESS
					if ($('div.georeference_window ul.main_list > li.selected').index()==0) {
						var latitude = $('a#latitude').attr('c');
	          var longitude = $('a#longitude').attr('c');
	          if (!(latitude=='' && longitude=='')) {
	            var params = {};
	            params['latitude_column'] = latitude;
	            params['longitude_column'] = longitude;
	            params['_method'] = "PUT"

	            var requestId = createUniqueId();
	            window.ops_queue.newRequest(requestId,'update_geometry');

	            $.ajax({                
	                type: "POST",
	                dataType: 'json',
	                url: global_api_url+'tables/'+ table_name,
	                data: params,
	                headers: {'cartodbclient':true},                                
	                success: function(data) {
	                  window.ops_queue.responseRequest(requestId,'ok','');
	                  successActionPerforming('update_geometry',null,null);
	                },
	                error: function(e) {
	                  window.ops_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors);
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
      $('div.georeference_window a.close_geo,div.georeference_window a.cancel').live('click',function(ev){
        stopPropagation(ev);
        closeOutTableWindows();
        unbindESC();
      });
			$('div.stop_window p a.cancel_geo').live('click',function(ev){
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
		  
		  $('div.mamufas').append(window.view_elements.advanced_options);
			
			$('div.inner_subheader div.right').append(window.view_elements.subheader_right);
	
	    $('p.settings a.settings, span.advanced_options a.advanced').live('click',function(ev){
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
        
        // Fill the table name + copy
        $('div.save_window span.top input').val(table_name + '_copy');

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
          window.ops_queue.newRequest(requestId,'duplicate_table');
	        
	        // If we are in a query view
	        var query = $('body').hasClass('query')
	        	, data = {};

	        if (query) {
	        	data = {from_query: editor.getValue(), name: new_table}
	        } else {
	        	data = {
              name: new_table,
              table_copy: table_name
            }
	        }

	        $.ajax({
            type: "POST",
            url: global_api_url+'tables',
            data: data,
            headers: {"cartodbclient":"true"},
            success: function(result) {
              window.location.href = '/tables/'+ result.name;
            },
            error: function(e) {
              closeOutTableWindows();
              window.ops_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).message);
            }
          });
	      } else {
	        $('div.save_window span.top input').addClass('error');
	        $('div.save_window span.top div.error_content').fadeIn().delay(3000).fadeOut();
	      }
	    });
	
	    $('a.export_data').live('click',function(ev){
        if (!$(this).parent().hasClass('disabled')) {
          stopPropagation(ev);
          if ($('div.mamufas').is(':visible') && $('div.delete_window').is(':visible')) {
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.export_window').show();
          } else {
            closeOutTableWindows();
            $('div.mamufas div.export_window').show();
            $('div.mamufas').fadeIn('fast');

            // Set form url correctly before choose a export option
            $('div.export_window').find('form').attr('action','/tables/' + table_name);

            bindESC();
          }
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
		  
		  $('div.mamufas').append(window.view_elements.delete_window);
		  
		  
			$('a.delete').live('click',function(ev){
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
		  
		  $('div.mamufas').append(window.view_elements.export_window);
			
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
		  $('div.mamufas').append(window.view_elements.warning_window);
        
			// Title window
	    $('div.inner_subheader div.left').append(window.view_elements.title_window);
	
			// Close warning window
			$('div.warning_window .cancel,div.warning_window .close').click(function(ev){
				stopPropagation(ev);
				closeOutTableWindows();
			});

	    //Bind events
	    // -Open window
	    $('section.subheader h2 a, p.status a.save').live('click',function(ev){
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
	    $('#change_name input[type="submit"]').live('click',function(ev){
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
	      }
	    });
	
			function changeTableName(new_value,old_value) {
        if ($('p.status a').hasClass('save')) {
          old_value.status = 'save';
          $('p.status a').removeClass('save').addClass('public').text('public');
        }
				document.title = new_value + ' - CartoDB';
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
	    $('div.inner_subheader div.left').append(window.view_elements.privacy_window);

	    // Check if the user can make private tables
	    if (!privacy_enabled) {
	    	$('div.inner_subheader div.left').find('span.privacy_window > ul > li.private')
	    		.removeClass('private')
	    		.addClass('disabled')
	    		.find('a')
	    		.html('<strong>Private</strong> (only paid plans)');
	    }

	    $('span.privacy_window ul li a').live('click',function(ev){
	      ev.preventDefault();
	      var parent_li = $(this).parent();
	      if (!parent_li.hasClass('disabled')) {
	        if (parent_li.hasClass('selected')) {
	        	ev.stopPropagation();
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
	            //$('span.mapkey').remove();
	          } else {
	            $('ul.tab_menu li a.share').addClass('disabled');
	            var style="";
	            if ($('body').hasClass('map')) {
	            	style = 'style="display:block"';
	            }
	          }
	          changesRequest('privacy',new_value.toUpperCase(),old_value);
	        }
	      } else {
	      	$('body').click()
	      }
	    });

	    $('p.status a').live('click',function(ev){
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
			
			$('div.inner_subheader div.left').append(window.view_elements.tags_window);

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
		  
		  //Append embed html to the document
			$('div.mamufas').append(window.view_elements.embed_window);
		  

		  // Bindings
		  $('ul.tab_menu li a.share').live('click',function(ev){
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
					changeEmbedCode();
	        
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
            return TILEHTTP + '://' + user_name + '.' + TILESERVER + '/tiles/' + table_name + '/'+zoom+'/'+coord.x+'/'+coord.y+'.png?sql=' + encodeURIComponent(($('body').hasClass('query'))?editor.getOption('query') : 'SELECT * FROM ' + table_name);
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
            url: global_api_url+'queries?sql='+encodeURIComponent('select ST_Extent(the_geom) from '+ table_name),
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
		  
			function changeEmbedCode() {
				var sql = (($('body').hasClass('query')) ? '?sql=' + encodeURIComponent(editor.getOption('query')) : '');
				$('div.embed_window span.copy_code input').val('<iframe src=\''+ TILEHTTP +'://'+ user_name + '.' + TILESERVER +'/tables/'+table_name+'/embed_map'+ sql +'\'></iframe>');
				$('div.embed_window div.tiles_code input').val(TILEHTTP +'://'+ user_name + '.' + TILESERVER +'/tables/'+table_name+'/embed_map'+ sql);
			}
		
		  return {}
		}());



    ///////////////////////////////////////
    //  Stop window                      //
    ///////////////////////////////////////
    var stop_window = (function() {
      
      $('div.mamufas').append(window.view_elements.stop_window);
        
      $('div.mamufas div.stop_window a.close').click(function(ev){
        stopPropagation(ev);
	      closeOutTableWindows();
	    });

      return {}
	  }());



	  ///////////////////////////////////////
    //  Map key window                   //
    ///////////////////////////////////////
   //  var mapkey_window = (function() {
      
			// $('div.mamufas').append(window.view_elements.mapkey_window);
      
   //    // Bindings
   //    $('div.mamufas div.mapkey_window a.close,div.mamufas div.mapkey_window a.cancel').click(function(ev){
   //      stopPropagation(ev);
	  //     closeOutTableWindows();
	  //   });

		 //  $('a.mapkey').live('click',function(ev){
		 //    stopPropagation(ev);		    
			// 	closeOutTableWindows();
		    
		 //    $("div.mapkey_window .inner_ span.top a.copy").zclip('remove');

		 //    // Change values of the inputs
	  //     $('div.mapkey_window').show();
	  //     $('div.mamufas').fadeIn('fast');

	  //     // Start zclip
   //      $("div.mapkey_window .inner_ span.top a.copy").zclip({
   //        path: "/javascripts/plugins/ZeroClipboard.swf",
   //        copy: function(){
			// 			$(this).parent().find('input').select();
   //          return $(this).parent().find('input').val();
   //        }
   //      });
	        
	  //     bindESC();
		 //  });

   //    return {}
	  // }());



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
  }


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
		$('body').addClass('map');
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
		$('body').removeClass('map');
    $('div.table_position').show();
    if (window.map.carto_map) {hideMap()}
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
    window.ops_queue.newRequest(requestId,param);

    $.ajax({
      dataType: 'json',
      type: "PUT",
      url: global_api_url+'tables/'+ table_name,
      data: params,
      headers: {'cartodbclient':true},
      success: function(data) {
        window.ops_queue.responseRequest(requestId,'ok','');
        successActionPerforming(param,value,old_value);
      },
      error: function(e) {
        window.ops_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText));
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
                              if (window.map.carto_map) window.map.carto_map.refresh();
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
											document.title = old_value.name + '- CartoDB';
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
      $('div.mamufas div.mapkey_window').hide();
      $(document).unbind('keydown');
      $('body').unbind('click');
    });
  }
  


	////////////////////////////////////////
  //  CHANGE STATUS OF THE APP (SQL) 	  //
  ////////////////////////////////////////
  // Change application to SQL or normal mode
	function setAppStatus() {
		var query_mode = ($('body').hasClass('query'));
		if (query_mode) {
		  $('a.open_georeference').css({opacity:0.5});
			$.favicon('/favicon/black_32x32.png');
			var html = $('p.settings').html();
			$('p.settings').html(html.replace(/\|/gi,''));
			$('body').addClass('query');
			$('body').animate({backgroundColor:'#282828'},500);

      // Change advanced options
			$('a.save_table').text('Table from query');
      $('a.export_data').parent().addClass('disabled');

			setTimeout(function(){$('body').css('background-position','0 -160px');},300);
			$('section.subheader').animate({backgroundColor:'#282828'},500);
			setTimeout(function(){$('section.subheader').css('background-position','0 -218px');},300);
		} else {
		  $('a.open_georeference').css({opacity:1});
			$.favicon('/favicon/blue_32x32.png');
			$('body').removeClass('query');

      // Change advanced options
      $('a.save_table').text('Duplicate table as...');
      $('a.export_data').parent().removeClass('disabled');
			$('p.settings a:lt(2)').after(' | ');

			$('body').animate({backgroundColor:'#2D3451'},500);
			setTimeout(function(){$('body').css('background-position','0 0');},300);
			$('section.subheader').animate({backgroundColor:'#2D3451'},500);
			setTimeout(function(){$('section.subheader').css('background-position','0 -58px');},300);
		}
	}
  
  
  
  
  