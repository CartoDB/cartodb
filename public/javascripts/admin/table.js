

    $(document).ready(function(){
      $("table#cDBtable").cDBtable(
        'start',{
          getDataUrl: '/api/json/tables/'+table_id,
          resultsPerPage: 50,
          reuseResults: 100,
          total: 5000
        }
      );


      //SUBHEADER EVENTS AND FLOATING WINDOWS

      //Save operation loader
      $('section.subheader').append(
      '<div class="performing_op">' +
        '<p class="loading">Loading...</p>'+
      '</div>');


      // change table status
      $('div.inner_subheader div.left').append(
        '<span class="privacy_window">'+
          '<ul>'+
            '<li class="public '+((status=="public")?'selected':'')+'"><a href="#"><strong>Public</strong> (visible to others)</a></li>'+
            '<li class="private '+((status=="private")?'selected':'')+'"><a href="#"><strong>Private</strong> (visible to you)</a></li>'+
          '</ul>'+
        '</span>');
        
      $('span.privacy_window ul li a').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var parent_li = $(this).parent();
        if (parent_li.hasClass('selected')) {
          $('span.privacy_window').hide();
        } else {
          var old_value = $('span.privacy_window ul li.selected a strong').text().toLowerCase();
          $('span.privacy_window ul li').removeClass('selected');
          parent_li.addClass('selected');
          var new_value = $('span.privacy_window ul li.selected a strong').text().toLowerCase();
          $('span.privacy_window').hide();
          $('p.status a').removeClass('public private').addClass(new_value).text(new_value);
          changesRequest('/toggle_privacy','privacy',new_value.toUpperCase(),old_value);
        }
      });

      $('p.status a').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var privacy_window = $(this).parent().parent().children('span.privacy_window');
        if (privacy_window.is(':visible')) {
          privacy_window.hide();
        } else {
          var status_position = $('p.status a').position();
          privacy_window.css('left',status_position.left-72+'px').show();
        }
      });
      // End table status binding








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



    function changesRequest(url_change,param,value,old_value) {
      //show loader
      $('div.performing_op').show();
      
      var params = {};
      params[param] = value;
      $.ajax({
        dataType: 'json',
        type: "PUT",
        url: '/api/json/tables/'+table_id+url_change,
        data: params,
        success: function(data) {
          successActionPerform(param);
        },
        error: function(e) {
          errorActionPerforming(param,old_value);
        }
      });
    }
    
    
    
    function successActionPerform(param) {
      switch (param) {
        case 'privacy': $('div.performing_op p').removeClass('loading').addClass('success').text('The status has been changed');
                        var width_text = $('div.performing_op p').width();
                        $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                        break;
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        default:
      }
      $('div.performing_op').delay(1000).fadeOut(function(){resetLoader()});
    }
    
    
    function errorActionPerforming(param, old_value) {
      switch (param) {
        case 'privacy': $('div.performing_op p').removeClass('loading').addClass('error').text('The status has not been changed. Try again later.');
                        var width_text = $('div.performing_op p').width();
                        $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                        $('span.privacy_window ul li').removeClass('selected');
                        $('span.privacy_window ul li.'+old_value).addClass('selected');
                        $('p.status a').removeClass('public private').addClass(old_value).text(old_value);
                        break;
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        default:
      }
      $('div.performing_op').delay(1000).fadeOut(function(){resetLoader()});
    }
    
    
    function resetLoader() {
      $('div.performing_op p').removeClass('success').addClass('loading').text('Loading...');
      var width_text = $('div.performing_op p').width();
      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
    }
    
    
    
    
    
