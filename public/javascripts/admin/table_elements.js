

  $(document).ready(function(){

    //SUBHEADER EVENTS AND FLOATING WINDOWS

    //Change title name window
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
      ev.stopPropagation();
      ev.preventDefault();
      if ($('span.title_window').is(':visible')) {
        $('span.title_window').hide();
      } else {
        closeAllWindows();
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
      ev.preventDefault();
      ev.stopPropagation();
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
        if ($('p.status a').hasClass('save')) {
          old_value.status = 'save';
          $('p.status a').removeClass('save').addClass('public').text('public');
        }
        $('section.subheader h2 a').text(new_value);
        $('span.title_window').hide();
        changesRequest('/update','name',new_value,old_value);
      }
    });


    // Change table status
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
      if (!$(this).hasClass('save')) {
        if (privacy_window.is(':visible')) {
          privacy_window.hide();
        } else {
          closeAllWindows();
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
    // End table status binding


    
    
    //Change tags
    $('div.inner_subheader div.left').append(
      '<span class="tags_window">'+
        '<ul id="tags_list"></ul>'+
        '<a href="#save_tags">Save</a>'+
      '</span>');
      
    $('span.tags a.add').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      closeAllWindows();
      bindESC();
      var values = [];
      $('span.tags p').each(function(index,element){
        values.push($(element).text());
      });
      $("#tags_list").tagit(
        //{availableTags: ["c++", "java", "php", "coldfusion", "javascript", "asp", "ruby", "python", "c", "scala", "groovy", "haskell", "perl"]}
        {values: values}
      );
      $('span.tags_window').show();
      $('body').click(function(event) {
        if (!$(event.target).closest('span.tags_window').length) {
          $('span.tags_window').hide();
          $('body').unbind('click');
        };
      });
    });
    
    $('span.tags_window a').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var old_values = [];
      $("span.tags p").each(function(index,element){
        old_values.push($(element).text());
      });
      var new_values = '';
      $("span.tags p").remove();  
      $("li.tagit-choice").each(function(index,element){
        var value = (($.trim($(element).text())).slice(0, -2));
        $('<p>'+value+'</p>').insertBefore('a.add');
        new_values+=value+',';
      });

      $('span.tags_window').hide();
      changesRequest('/update','tags',new_values,old_values);
    });
    



    //Advanced options
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
        closeAllWindows();
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
    //End advanced options
    
    
    //Delete table
    $('a.delete').click(function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      closeAllWindows();
      var table_id = $(this).attr('table-id');
      $('div.mamufas a.confirm_delete').attr('table-id',table_id);
      $('div.mamufas div.delete_window').show();
      $('div.mamufas').fadeIn('fast');
      bindESC();
    });
    
    
    $('div.mamufas a.cancel, div.mamufas a.close_delete').click(function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      $('div.mamufas').fadeOut('fast',function(){
        $('div.mamufas div.delete_window').hide();
      });
      unbindESC();
    });
    
    //Magic select
    $('span.select a.option').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      if ($(this).parent().hasClass('clicked')) {
        $(this).parent().removeClass('clicked');
      } else {
        $('span.select').removeClass('clicked');
        $(document).bind('click',function(ev){
          if (!$(ev.target).closest('span.select').length) {
            $('span.select').removeClass('clicked');
          };
        });
        $(this).parent().addClass('clicked');
        $(this).parent().find('ul').jScrollPane();
      }
    });
    
    $('div.select_content ul li a').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      $(this).closest('span.select').children('a.option').text($(this).text());
      $(this).closest('span.select').children('a.option').attr('index',$(this).attr('index'));
      $('span.select').removeClass('clicked');
      //TODO change select option selected
    });
    
    
    $('a.confirm_delete').click(function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      var table_id = $(this).attr('table-id');
      $.ajax({
        type: "DELETE",
        url: '/api/json/tables/'+table_id,
        success: function(data, textStatus, XMLHttpRequest) {
          window.location.href = XMLHttpRequest.getResponseHeader("Location");
        },
        error: function(e) {
          console.debug(e);
        }
      });
    });
  });



  function changesRequest(url_change,param,value,old_value) {
    
    //TODO add loader queue
    var params = {};
    params[param] = value;
    
    var requestId = createUniqueId();
    params.requestId = requestId; 
    requests_queue.newRequest(requestId,param);
    
    $.ajax({
      dataType: 'json',
      type: "PUT",
      url: '/api/json/tables/'+table_id+url_change,
      data: params,
      success: function(data) {
        requests_queue.responseRequest(requestId,'ok','');
      },
      error: function(e) {
        requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText));
        errorActionPerforming(param,old_value,$.parseJSON(e.responseText));
      }
    });
  }

  



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
      default:
    }
  }


  
  
  function bindESC() {
    $(document).keydown(function(event){
      if (event.which == '27') {
        closeAllWindows();
      }
    });
  }
  
  function unbindESC() {
    $(document).unbind('keydown');
    $('body').unbind('click');
  }  
  
  
  
  function closeAllWindows() {
    $('span.privacy_window').hide();
    $('span.title_window').hide();
    $('span.advanced_options').hide();
    $('span.tags_window').hide();
    
    //popup windows
    $('div.mamufas').fadeOut('fast',function(){
      $('div.mamufas div.delete_window').hide();
      $('div.mamufas div.georeference_window').hide();
      $('div.mamufas div.export_window').hide();
    });
    
    $(document).unbind('keydown');
    $('body').unbind('click');
  }
