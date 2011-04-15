
  //SUBHEADER EVENTS AND FLOATING WINDOWS+//


  head(function(){

    ///////////////////////////////////////
    //  Mamufas addition                 //
    ///////////////////////////////////////
    $('div.mamufas').append(
      '<div class="delete_window">'+
        '<a href="#close_window" class="close_delete"></a>'+
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
        '<a href="#close_window" class="close_delete"></a>'+
        '<div class="inner_">'+
          '<form action="/tables/'+ table_id +'" method="get">'+
            '<input id="export_format" type="hidden" name="format" />'+
            '<span class="top">'+
              '<h3>Export your data</h3>'+
              '<p>Select your desired format for downloading the data</p>'+
              '<ul>'+
                '<li class="selected"><a class="option" href="#CSV" rel="csv">CSV (Comma separated values)</a></li>'+
                '<li><a class="option" href="#KML" rel="kml">KML</a></li>'+
                '<li><a class="option" href="#SHP"rel="shp">SHP</a></li>'+
              '</ul>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<input type="submit" class="download" value="Download" />'+
            '</span>'+
        '</div>'+
      '</div>'+
      '<div class="save_window">'+
        '<a href="#close_window" class="close_save"></a>'+
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
      '</div>'
      );



    ///////////////////////////////////////
    //  Change title name window         //
    ///////////////////////////////////////
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
        if ($('p.status a').hasClass('save')) {
          old_value.status = 'save';
          $('p.status a').removeClass('save').addClass('public').text('public');
        }
        $('section.subheader h2 a').text(new_value);
        $('span.title_window').hide();
        changesRequest('name',new_value,old_value);
      }
    });




    ///////////////////////////////////////
    //  Change table status              //
    ///////////////////////////////////////
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
      var privacy_window = $(this).parent().parent().children('span.privacy_window');
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




    ///////////////////////////////////////
    //  Change table tags                //
    ///////////////////////////////////////
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
        $('<p>'+value+'</p>').insertBefore('a.add');
        new_values+=value+',';
      });

      $("span.tags p:last").last().addClass('last');
      $('span.tags_window').hide();
      changesRequest('tags',new_values,old_values);
    });




    ///////////////////////////////////////
    //  Advanced options                 //
    ///////////////////////////////////////
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
      closeOutTableWindows();
      $('div.mamufas div.export_window').show();
      $('div.mamufas').fadeIn('fast');
      bindESC();
    });




    ///////////////////////////////////////
    //  Delete table                     //
    ///////////////////////////////////////
    $('a.delete').click(function(ev){
      stopPropagation(ev);
      closeOutTableWindows();
      var table_id = $(this).attr('table-id');
      $('div.mamufas a.confirm_delete').attr('table-id',table_id);
      $('div.mamufas div.delete_window').show();
      $('div.mamufas').fadeIn('fast');
      bindESC();
    });
    $('div.mamufas a.cancel, div.mamufas a.close_delete, div.mamufas a.close_save').click(function(ev){
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
        url: '/v1/tables/'+table_name,
        dataType: "text",
        headers: {'cartodbclient':true},
        success: function(data, textStatus, XMLHttpRequest) {
          window.location.href = '/dashboard';
        },
        error: function(e) {
          console.debug(e);
        }
      });
    });

    ///////////////////////////////////////
    //  Export table                     //
    ///////////////////////////////////////
    $('div.mamufas div.export_window form a.option').click(function(ev){
      stopPropagation(ev);
      var format = $(this).attr('rel');
      $('div.mamufas div.export_window form ul li').removeClass('selected');
      $(this).parent().addClass('selected');
      $('#export_format').val(format);
    });
    $('#export_format').val($('div.mamufas div.export_window form ul li.selected a.option').attr('rel'));

    ///////////////////////////////////////
    //  Application tabs menu            //
    ///////////////////////////////////////
    $('section.subheader ul.tab_menu li a').click(function(ev){
      stopPropagation(ev);
      closeOutTableWindows();
      if (!$(this).parent().hasClass('selected')) {
        if ($(this).text()=="Table") {
          $('section.subheader ul.tab_menu li').removeClass('selected');
          $(this).parent().addClass('selected');
          $(document).trigger('click');
          $('body').trigger('refresh');
          $('body').trigger('enabled',[true]);
          $('div.table_position').show();
          hideMap();
        } else {
          if (geolocating) {
            $('p.geo').trigger('click');
          } else {
            $('section.subheader ul.tab_menu li').removeClass('selected');
            $(this).parent().addClass('selected')
            $('div.table_position').hide();
            $(document).trigger('click');
            $('body').trigger('enabled',[false]);
            showMap();
          }
        }
      }
    });
  });



  function changesRequest(param,value,old_value) {
    var params = {};
    params[param] = value;

    var requestId = createUniqueId();
    params.requestId = requestId;
    requests_queue.newRequest(requestId,param);

    $.ajax({
      dataType: 'json',
      type: "PUT",
      url: '/v1/tables/'+table_name,
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


  function bindESC() {
    $(document).keydown(function(event){
      if (event.which == '27') {
        closeOutTableWindows();
      }
    });
  }
  function unbindESC() {
    $(document).unbind('keydown');
    $('body').unbind('click');
  }



  function closeOutTableWindows() {
    $('span.privacy_window').hide();
    $('span.title_window').hide();
    $('span.advanced_options').hide();
    $('span.tags_window').hide();

    //popup windows
    $('div.mamufas').fadeOut('fast',function(){
      $('div.mamufas div.delete_window').hide();
      $('div.mamufas div.export_window').hide();
      $('div.mamufas div.save_window').hide();
      $(document).unbind('keydown');
      $('body').unbind('click');
    });
  }


  function triggerSqlEvent(event) {
    if (event==13) {
      $(document).trigger("sqlEnter");
    }
  }