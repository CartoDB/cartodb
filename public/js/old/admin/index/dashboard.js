

    head(function(){

      // Privacy tooltip
      var p_change;
      var table_name;
      $('span.info p.status').click(function(ev){
        stopPropagation(ev);
        p_change = $(this);
        var status = $(this).text().toLowerCase();
        $('span.privacy_window li').each(function(i,ele){
          $(ele).removeClass('selected');
        });
        table_name = $(this).parent().find('h4').text();
        $('span.privacy_window li.'+status).addClass('selected');
        var pos = $(this).closest('li').position();
        pos.left = $(this).position().left;
        var offset = $(this).width()/2;
        $('span.privacy_window').css({top:31+pos.top+'px',left:pos.left-90+offset+'px'}).show();
        bindESC();
        $('body').unbind('click');
        $('body').click(function(event) {
          if (!$(event.target).closest('span.privacy_window').length) {
            $('span.privacy_window').fadeOut('fast');
            $('body').unbind('click');
          };
        });
      });
      
      
      $('span.privacy_window li a').click(function(ev){
        stopPropagation(ev);
        if (!$(this).parent().hasClass('selected') && !$(this).parent().hasClass('disabled')) {
          $('span.privacy_window li').each(function(i,ele){
            $(ele).removeClass('selected');
          });
          $(this).parent().addClass('selected');
          var status = ($(this).find('strong').text() == "Private")?'PRIVATE':'PUBLIC';
          p_change.removeClass('public private').addClass(status.toLowerCase());
          p_change.text(status);
          $('span.privacy_window').fadeOut('fast');

          var params = {};
          params['privacy'] = status;
          
          $.ajax({
            dataType: 'json',
            type: "PUT",
            url: global_api_url+'tables/'+table_name,
            data: params,
            headers: {'cartodbclient':true},
            success: function(data) {},
            error: function(e) {}
          });
        } else {
        	$('body').click();
        }
      });

      
      // Right column floating effect		
      $(window).scroll(
        function(ev) {
          var right_column = $('div.tables_list div.right')
            , scrolled = $(window).scrollTop()
            , right_column_height = right_column.height()
            , right_column_pos = $('div.tables_list div.left').offset().top
            , list_height = $('div.tables_list').height() + right_column_pos - right_column_height;

          if (scrolled>(right_column_pos-30)) {
            if (scrolled<list_height) {
              right_column.css({'position':'fixed','margin':'-'+(right_column_pos-30)+'px 0 0 19px','display':'inline-block', 'vertical-align':'top'});
            } else {
              right_column.css({'position':'relative','margin':'0 0 0 19px','display':'inline-block','vertical-align':'bottom'});
            }
          } else {
            right_column.removeAttr('style');
          }
        }
      );
      
      //Put paginator in middle
      var paginator_width = $('div.paginate').width();
      $('div.paginate').css('margin-left', ((626-paginator_width)/2) +'px');
      $('div.paginate').show();

      $('a.close').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div.section').fadeOut();
      });
      
      $('div.notification').delay(5000).fadeOut();

      $('ul.your_tables li.last').hover(function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 -5px');
      }, function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 bottom');
      });
      
      

      //Close all modal windows
      $('div.mamufas a.cancel, div.mamufas a.close_delete, div.mamufas a.close_settings, div.mamufas a.close_create, div.mamufas a.close').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.settings_window').hide();
          $('div.mamufas div.delete_window').hide();
          $('div.mamufas div.create_window').hide();
          $('div.mamufas div.export_window').hide();
          resetUploadFile();
        });
        unbindESC();
      });


      //Delete window
      $('a.delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_name = $(this).attr('table-name');
        $('div.mamufas a.confirm_delete').attr('table-name',table_name);
        $('div.mamufas div.delete_window').show();
        $('div.mamufas').fadeIn('fast');
        bindESC();
      });
      $('a.confirm_delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var table_name = $(this).attr('table-name');
        $.ajax({
          type: "DELETE",
          dataType: "text",
          url:global_api_url+'tables/'+table_name,
          headers: {'cartodbclient':true},
          success: function(data, textStatus, XMLHttpRequest) {
						$.cookie('flash', 'Table successfully removed');
            window.location.href = "/dashboard";
          },
          error: function(e) {}
        });
      });
      
      
      
      //Export window
      $('a.export_data').click(function(ev){
        stopPropagation(ev);
        if ($('div.mamufas').is(':visible') && $('div.delete_window').is(':visible')) {
          $('div.mamufas div.export_window form').attr('action','/tables/'+$('div.mamufas a.confirm_delete').attr('table-name'));
          $('div.mamufas div.delete_window').hide();
          $('div.mamufas div.export_window').show();
        } else {
          $('div.mamufas div.export_window').show();
          $('div.mamufas').fadeIn('fast');
          bindESC();
        }
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
      
      $('div.mamufas div.export_window form').submit(function(ev){
				$('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.export_window').hide();
        });
      });
      
      $('#export_format').val($('div.mamufas div.export_window form ul li.selected a.option').attr('rel'));
      
      
      $('#hugeUploader').hide();
  	  //Drop files on the dashboard to import them
      $(document).bind('dragenter', onDragEnter);
    });




    
    function onDragEnter(event){
  		event.stopPropagation();
  		event.preventDefault();
  		$('#hugeUploader').show();
  		$('.qq-upload-drop-area').show();  		
  		$('#hugeUploader .qq-upload-drop-area').bind('dragleave', onDragExit);
  		$('#hugeUploader .qq-upload-drop-area').bind('drop', onDragExit);  		
  		$('#hugeUploader .qq-upload-drop-area').bind('dragover', function(event) {event.stopPropagation(); event.preventDefault();});
  		return false;
    };
    
    function onDragExit(event){
  		event.stopPropagation();
  		event.preventDefault();
  		$('#hugeUploader').hide();
  		$('.qq-upload-drop-area').hide();
  		return false;
    };
    


    function bindESC() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          $('div.mamufas').fadeOut('fast',function(){
            $('div.mamufas div.settings_window').hide();
            $('div.mamufas div.delete_window').hide();
            $('div.mamufas div.create_window').hide();
            $('div.mamufas div.export_window').hide();
            $('span.privacy_window').fadeOut('fast');
          });
        }
      });
    };

    function unbindESC() {
      $(document).unbind('keydown');
    };


