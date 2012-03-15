
  //VIEW//

  function initView(){

  	// Inits loader queue
		window.ops_queue = new loaderQueue();
    
    // Initialize cartodb-view
    window.view = {};

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
				$('div.export_window').find('form').attr('action','/tables/' + table_name + '.' + $('#export_format').val());

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
    //popup windows
    $('div.mamufas').fadeOut('fast',function(){
      $('div.mamufas div.export_window').hide();
      $('div.mamufas div.save_window').hide();
      $(document).unbind('keydown');
      $('body').unbind('click');
    });
  }
  
  
  
  