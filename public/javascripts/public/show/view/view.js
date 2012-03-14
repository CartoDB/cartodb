
  //SUBHEADER EVENTS AND FLOATING WINDOWS+//

  function initView(){

  	// Inits loader queue
		window.ops_queue = new loaderQueue();
    
    // Initialize cartodb-view
    window.view = {};


	  ///////////////////////////////////////
    //  Advanced options                 //
    ///////////////////////////////////////
		var advanced_options = (function() {
		  
		  // Append neccessary html
		  $('div.mamufas').append(window.view_elements.duplicate_window);
				
		  // Bind events
	    $('a.duplicate').click(function(ev){
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

	    $('div.mamufas div.save_window a.close,div.mamufas div.save_window a.cancel').click(function(ev){
	      stopPropagation(ev);
	      closeOutTableWindows();
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
	        
	        var data = {
            name: new_table,
            table_copy: table_name
          }

	       // $.ajax({
         //    type: "POST",
         //    url: global_api_url+'tables',
         //    data: data,
         //    headers: {"cartodbclient":"true"},
         //    success: function(result) {
         //      window.location.href = '/tables/'+ result.name;
         //    },
         //    error: function(e) {
         //      closeOutTableWindows();
         //      window.ops_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).message);
         //    }
         //  });
	      } else {
	        $('div.save_window span.top input').addClass('error');
	        $('div.save_window span.top div.error_content').fadeIn().delay(3000).fadeOut();
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
    //  Export window                    //
    ///////////////////////////////////////
		var export_table = (function() {
		  
		  // Append element
		  $('div.mamufas').append(window.view_elements.export_window);

		  // Bind events
		 	$('a.export').live('click',function(ev){
	      stopPropagation(ev);
        closeOutTableWindows();

        $('div.mamufas div.export_window').show();
        $('div.mamufas').fadeIn('fast');

        // Set form url correctly before choose a export option
				$('div.export_window').find('form').attr('action','/tables/' + table_name);

        bindESC();
	    });
			
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
    hideMap();
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
  
  
  
  