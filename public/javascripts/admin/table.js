
    
    $(document).ready(function(){
      $("table#cDBtable").cDBtable(
        'start',{
          getDataUrl: '/api/json/table/'+table_id,  
          paginateParam: "rows_per_page",
          resultsPerPage: 50,
          reuseResults: 100,
          total: 5000
        }
      );


      //SUBHEADER EVENTS AND FLOATING WINDOWS
      
      // change table status
      
      $('div.inner_subheader div.left').append(
        '<span class="privacy_window">'+
          '<ul>'+
            '<li class="public '+((status=="public")?'selected':'')+'"><a href="#"><strong>Public</strong> (visible to others)</a></li>'+
            '<li class="private '+((status=="private")?'selected':'')+'"><a href="#"><strong>Private</strong> (visible to you)</a></li>'+
          '</ul>'+
        '</span>');
        
      
      $('p.status a').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var status_position = $('p.status a').position();
        
      });
        
        
        
        
      // change save to unsaved table
      // $('div.inner_subheader div.right').append(
      //  '<span class="advanced_options">'+
      //     '<a href="#" class="advanced">advanced<span></span></a>'+
      //     '<ul>'+
      //       '<li><a href="#">Export data...</a></li>'+
      //       '<li><a href="#">Save table as...</a></li>'+
      //     '</ul>'+
      //   '</span>');
      
      
      
      
      
      $('div.inner_subheader div.right').append(
        '<span class="advanced_options">'+
          '<a href="#close_advanced_options" class="advanced">advanced<span></span></a>'+
          '<ul>'+
            '<li><a href="#export_data">Export data...</a></li>'+
            '<li><a href="#save_table">Save table as...</a></li>'+
          '</ul>'+
        '</span>');

      $('p.settings a.settings, span.advanced_options a.advanced').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if (!$('span.advanced_options').is(':visible')) {
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



    });
    
    
    
    function changesRequest(param,values) {
      var params = {};
      params[param] = values;
      $.ajax({
        dataType: 'jsonp',
        method: "GET",
        url: '/api/json/table/'+table_id+'',
        data: params,
        success: function(data) {
          console.debug(data);
        },
        error: function(e) {
          console.debug(e);
        }
      });
    }
