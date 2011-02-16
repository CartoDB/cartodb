
// FUNCIONALITIES
//   - Editing table data with events
//   - Resize columns
//   - Pagination with ajax --- OK
//   - Custom style --- OK
//   - jScrollPane
//   - Update table (remove columns and rows, add columns and rows, move columns, sort columns)
//   - Validate fields
//   - Rows selection for multiple edition
//   - Floating tHead  --- OK
//   - Floating first column --- OK


//Elements out of the plugin (Be careful with this!)
// - Blue header
// - div.table_position
// - section subheader

// We are playing with these containers but they don't belong to the plugin

(function( $ ){

  var table;
  var loading = false;
  var minPage = 0;
  var maxPage = -1;
  var defaults;
  var actualPage;
  var total;
  var cell_size = 100;
  var last_cell_size = 100;

  var methods = {


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  INIT PLUGIN
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init : function() {
      return this.each(function(){
        table = $(this)[0];
        methods.getData(defaults, 'next');
        methods.keepSize();
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  GET DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getData : function(options, direction) {
     //Pagination AJAX adding rows
     if (direction=="next") {
       maxPage++;
       actualPage = maxPage;
     } else {
       minPage--;
       actualPage = minPage;
     }

     $.ajax({
       method: "GET",
       url: options.getDataUrl,
       data: {
         rows_per_page: options.resultsPerPage,
         page: actualPage
       },
       success: function(data) {
         if (data.total_rows==0) {
           //Start new table
           //Calculate width of th on header
           var window_width = $(window).width();
           if (window_width>((data.columns.length*128)+42)) {
             cell_size = ((window_width-170)/(data.columns.length-1))-27;
             last_cell_size = cell_size;
           }

           if ($(table).children('thead').length==0) {methods.drawColumns(data.columns);}
           methods.startTable();
         } else {
           total = data.total_rows;
           if (data.rows.length>0) {
             if ($(table).children('thead').length==0) {
               //Calculate width of th on header
               var window_width = $(window).width();
               if (window_width>((data.columns.length*128)+42)) {
                 cell_size = ((window_width-170)/(data.columns.length-1))-27;
                 last_cell_size = cell_size;
               }
               methods.drawColumns(data.columns);
             }
             methods.drawRows(options,data.rows,direction,actualPage);
           } else {
             methods.hideLoader();
             if (direction=="next") {
                maxPage--;
             } else {
                minPage++;
             }
           }
         }
       }
     });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DRAW COLUMNS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    drawColumns: function(data) {
      //Draw the columns headers
      var thead = '<thead><tr><th class="first"><div></div></th>';

      $.each(data,function(index,element){

        var column_types = '<span class="col_types">' +
                        '<p>'+element[1]+'</p>' +
                        '<ul>' +
                          '<li class="selected"><a href="#">String</a></li>' +
                          '<li><a href="#">Number</a></li>' +
                          '<li><a href="#">Date</a></li>' +
                          '<li><a href="#">Lat/Lng</a></li>' +
                          '<li><a href="#">Geometry</a></li>' +
                        '</ul>' +
                      '</span>';

        var col_ops_list = '<span class="col_ops_list">' +
                        '<h5>EDIT</h5>' +
                        '<ul>' +
                          '<li><a>Order by this column</a></li>' +
                          //'<li><a>Filter by this column</a></li>' +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="rename_column" href="#rename_column">Rename column</a></li>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="change_data_type" href="#change_data_type">Change data type</a></li>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="delete_column" href="#delete_column">Delete column</a></li>':'') +
                        '</ul>' +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<div class="line"></div>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<h5>GEOREFERENCE</h5>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<ul>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a href="#" class="open_georeference">Georeference with this</a></li>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'</ul>':'') +
                        '<div class="line"></div>'+
                        '<h5>CREATE</h5>' +
                        '<ul>' +
                          '<li class="last"><a href="#">Add new column</a></li>' +
                        '</ul>' +
                      '</span>';
        thead += '<th>'+
                    '<div '+((index==0)?'':' style="width:'+cell_size+'px"') + '>'+
                      '<span class="long">'+
                        '<h3 class="'+((element[0]=="cartodb_id" || element[0]=="created_at" || element[0]=="updated_at")?'static':'')+'">'+element[0]+'</h3>'+
                        ((element[2]!=undefined)?'<p class="geo '+element[2]+'">geo</p>':'') +
                        ((element[0]=="cartodb_id" || element[0]=="created_at" || element[0]=="updated_at")?'':'<input type="text" value="'+element[0]+'"/>') +
                      '</span>'+
                      '<p class="long">'+
                        ((element[0]=="cartodb_id" || element[0]=="created_at" || element[0]=="updated_at")?'<a class="static">'+element[1]+'</a>':'<a href="#" class="column_type">'+element[1]+'</a>') +
                      '</p>'+
                      '<a class="options" href="#">options</a>'+
                      col_ops_list+
                      ((element[0]=="cartodb_id" || element[0]=="created_at" || element[0]=="updated_at")?'':column_types) +
                    '</div>'+
                  '</th>';

      });
      thead += "</thead></tr>";
      $(table).append(thead);

      //Scroll event
      methods.addScroll();

      //Cell click event
      methods.bindCellEvents();

      //Create elements
      methods.createElements();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DRAW ROWS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    drawRows: function(options,data,direction,page) {

      if ($(table).children('tbody').length==0) {
        var tbody = '<tbody>';
      } else {
        var tbody = '';
      }


      //Loop all the data
      $.each(data, function(i,element){
        var options_list =  '<span>' +
                              '<h5>EDIT</h5>' +
                              '<ul>' +
                                '<li><a href="#">Duplicate row</a></li>' +
                                '<li><a href="#">Delete row</a></li>' +
                              '</ul>' +
                              '<div class="line"></div>'+
                              '<h5>CREATE</h5>' +
                              '<ul>' +
                                '<li class="last"><a href="#">Add new row</a></li>' +
                              '</ul>' +
                            '</span>';
        tbody += '<tr r="'+element.cartodb_id+'"><td class="first" r="'+ element.cartodb_id +'"><div><a href="#" class="options">options</a>'+options_list+'</div></td>';
        $.each(element, function(j,elem){
          tbody += '<td '+((j!="cartodb_id")?'':'class="id"')+' r="'+ element.cartodb_id +'" c="'+ j +'"><div '+((j=='cartodb_id')?'':' style="width:'+cell_size+'px"') + '>'+elem+'</div></td>';
        });
        
        var start = tbody.lastIndexOf('"width:');
        var end = tbody.lastIndexOf('px"');
        tbody = tbody.substring(0,start) + '"width:' + last_cell_size + tbody.substring(end);
        
        tbody += '</tr>';
      });


      if ($(table).children('tbody').length==0) {
        tbody += '</tbody>';
        $(table).append(tbody);
      } else {
        (direction=="previous")?$(table).children('tbody').prepend(tbody):$(table).children('tbody').append(tbody);
      }

      methods.checkReuse(direction);
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CHECK COLUMNS USED FOR REUSING
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkReuse: function(direction) {

      if ((((maxPage - minPage)+1)*defaults.resultsPerPage>defaults.reuseResults)) {
        if (direction=="next") {
          minPage++;
          $(table).children('tbody').children('tr:lt('+defaults.resultsPerPage+')').remove();
        } else {
          maxPage--;
          $(table).children('tbody').children('tr:gt('+(defaults.reuseResults-1)+')').remove();
        }
      }

      methods.hideLoader();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CREATE TABLE ELEMENTS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createElements: function() {

      //Paginate loaders
      $(table).prepend(
      '<div class="loading_previous loading">' +
        '<img src="/images/admin/table/activity_indicator.gif" alt="Loading..." title="Loading" />'+
        '<p>Loading previous rows...</p>'+
        '<p class="count">Now vizzualizing 50 of X,XXX</p>'+
      '</div>');

      $(table).parent().append(
      '<div class="loading_next loading">' +
        '<img src="/images/admin/table/activity_indicator.gif" alt="Loading..." title="Loading" />'+
        '<p>Loading next rows...</p>'+
        '<p class="count">Now vizzualizing 50 of X,XXX</p>'+
      '</div>');


      //General options
      $(table).parent().append(
        '<div class="general_options">'+
          '<ul>'+
            '<li><a class="sql" href="#"><span>SQL</span></a></li>'+
            '<li><a href="#"><span>Add row</span></a></li>'+
            '<li><a href="#"><span>Add column</span></a></li>'+
            '<li><a href="#"><span class="dropdown">Views (2)</span></a></li>'+
            '<li class="other"><a href="#"><span class="dropdown">Other queries (2)</span></a></li>'+
          '</ul>'+
          //SQL Console
          '<div class="sql_console">'+
            '<span>'+
              '<h3>Saved Query 2 / <strong>187 results</strong> <a class="get_api_call" href="#get_api_call">GET API CALL</a></h3>'+
              '<a href="#close_this_view" class="close">close this view</a>'+
            '</span>'+
            '<textarea></textarea>'+
            '<span>'+
              '<a class="try_query" href="#">Try query</a>'+
              '<a class="save_query" href="#">Save this query</a>'+
            '</span>'+
          '</div>'+
        '</div>'
      );

      //Edit caption
      $(table).parent().append(
        '<div class="edit_cell">'+
          '<a class="close" href="#">X</a>'+
          '<textarea></textarea>'+
          '<span>'+
            '<a class="cancel" href="#">Cancel</a>'+
            '<a class="save" href="#">Save changes</a>'+
          '</span>'+
        '</div>'
      );

      //Data error tooltip
      $(table).parent().append(
        '<div class="error_cell">'+
          '<div class="inner">'+
            '<p>Your field doesn’t look like a valid lat/long field</p>'+
          '</div>'+
        '</div>'
      );
      
      //CSS Hack for cover end of table
      //Data error tooltip
      $(table).append('<span class="end_table"></span>');

    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  NEW TABLE (EMPTY)
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startTable: function() {
      $(table).parent().append(
        '<div class="empty_table">'+
          '<h5>Add some rows to your table</h5>'+
          '<p>You can <a href="#">add it manually</a> or <a href="#">import a file</a></p>'+
        '</div>'
      );
      methods.resizeTable();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  ADD SCROLL PAGINATE BINDING
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    addScroll: function() {
      $(document).scroll(function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        
        //For moving thead when scrolling
        if ($(document).scrollTop()>58) {
          $('section.subheader').css('top','0');
          $(table).children('thead').css('top','102px');
        } else {
          $('section.subheader').css('top',58-$(document).scrollTop()+'px');
          $(table).children('thead').css('top',160-$(document).scrollTop()+'px');
        }


        //For paginating data
        if (!loading) {
          var difference = $(document).height() - $(window).height();
          if ($(window).scrollTop()==difference) {
            loading = true;
            methods.showLoader('next');
            setTimeout(function(){methods.getData(defaults,'next')},500);
          } else if ($(window).scrollTop()==0 && minPage!=0) {
            loading = true;
            methods.showLoader('previous');
            setTimeout(function(){methods.getData(defaults,'previous')},500);
          }
        }
      });


      $('div.table_position').scroll(function(ev){
        //For moving first table column
        $(table).children('tbody').children('tr').children('td.first').css('left',$('div.table_position').scrollLeft()+'px');
        $(table).children('thead').children('tr').children('th.first').css('left',$('div.table_position').scrollLeft()+'px');
        $(table).children('thead').css('left',-$('div.table_position').scrollLeft()+'px');
      });

    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  SHOW PAGINATE LOADER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    showLoader: function(kind){
      if (minPage==0) {
        var range = (maxPage - minPage + 1)*defaults.resultsPerPage;
      } else {
        var range = minPage*defaults.resultsPerPage+'-'+((maxPage+1)*defaults.resultsPerPage);
      }

      if (kind=="previous") {
        $('div.loading_previous p.count').text('Now vizzualizing '+range+' of '+defaults.total);
        $(table).children('tbody').css('padding','0');
        $(table).children('tbody').css('margin','0');
        $('div.loading_previous').show();
      } else {
        $('div.loading_next p.count').text('Now vizzualizing '+range+' of '+defaults.total);
        $('div.loading_next').show();
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  HIDE PAGINATE LOADER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    hideLoader: function() {
      loading = false;
      $('div.loading_next').hide();
      $('div.loading_previous').hide();
      $(table).children('tbody').css('padding','53px 0 0 0');
      $(table).children('tbody').css('margin','5px 0 0 0');
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  BIND CELL EVENTS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    bindCellEvents: function() {

      ///////////////////////////////////////
      //  DOUBLE CLICK -> Open editor      //
      ///////////////////////////////////////
      $(document).dblclick(function(event){
        var target = event.target || event.srcElement;
        var targetElement = target.nodeName.toLowerCase();

        if (targetElement == "div" && $(target).parent().attr('c')!=undefined && !$(target).parent().hasClass('id') && $(target).parent().attr('c')!="cartodb_id" &&
          $(target).parent().attr('c')!="updated_at" && $(target).parent().attr('c')!="created_at") {

          var target_position = $(target).parent().offset();
          var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
          $('tbody tr[r="'+data.row+'"]').addClass('editing');

          //Check if frist row or last column
          if ($(target).parent().offset().top<230) {$('div.edit_cell').css('top',target_position.top-150+'px');} else {$('div.edit_cell').css('top',target_position.top-192+'px');}
          if ($("div.table_position").width()<=($(target).parent().offset().left+cell_size+28)) {$('div.edit_cell').css('left',target_position.left-215+($(target).width()/2)+'px');} else {$('div.edit_cell').css('left',target_position.left-128+($(target).width()/2)+'px');}

          $('div.edit_cell textarea').text(data.value);
          $('div.edit_cell a.save').attr('r',data.row);
          $('div.edit_cell a.save').attr('c',data.column);
          $('div.edit_cell').show();

          if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            event.stopPropagation();
            event.returnValue = false;
          }
        }
      });



      ///////////////////////////////////////
      //  SIMPLE CLICK -> Open editor      //
      ///////////////////////////////////////
      $(document).click(function(event){
        var target = event.target || event.srcElement;
        var targetElement = target.nodeName.toLowerCase();

        //Clicking in first column element + Key
        if ((targetElement == "div" && event.ctrlKey) || (targetElement == "div" && event.metaKey)) {
          $('tbody tr').removeClass('editing');
          $('tbody tr').removeClass('selecting_first');
          $('tbody tr').removeClass('selecting');
          $('tbody tr').removeClass('selecting_last');
          $(target).parent().parent().removeClass('selecting_first').removeClass('border').addClass('selected');

          if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            event.stopPropagation();
            event.returnValue = false;
          }
        }

        //Clicking in first column element
        if (targetElement == "a" && $(target).parent().parent().hasClass('first')) {
          if (!$(target).parent().parent().parent().hasClass('selecting_first')) {
            $('tbody tr').removeClass('editing');
            $('tbody tr').removeClass('selecting_first');
            $('tbody tr').removeClass('selecting');
            $('tbody tr').removeClass('selecting_last');
            //$('tbody tr').removeClass('selected');
            if (!$(target).parent().parent().parent().hasClass('selected')) {
              $(target).parent().parent().parent().addClass('editing');
            }
          }

          if (!$(target).hasClass('selected')) {
            $('tbody tr td.first div span').hide();
            $('tbody tr td.first div a.options').removeClass('selected');
            $(target).parent().children('span').show();
            $(target).addClass('selected');

            $('body').click(function(event) {
              if (!$(event.target).closest('tbody tr td div span').length) {
                $('table tbody tr td.first div a.options').removeClass('selected');
                $('table tbody tr td.first div span').hide();
                $('body').unbind('click');
              };
            });
          }
          if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            event.stopPropagation();
            event.returnValue = false;
          }
        }
      });



      ///////////////////////////////////////
      //  Editing selected rows            //
      ///////////////////////////////////////
      $(document).mousedown(function(event){
        var target = event.target || event.srcElement;
        var targetElement = target.nodeName.toLowerCase();

        if (targetElement == "div" && $(target).parent().is('td') && !event.ctrlKey && !event.metaKey) {
          $('table tbody tr td.first div span').hide();
          $('table tbody tr td.first div a.options').removeClass('selected');
          $('tbody tr').removeClass('editing');
          $('tbody tr').removeClass('selecting_first').removeClass('border');
          $('tbody tr').removeClass('selecting');
          $('tbody tr').removeClass('selecting_last');
          $('tbody tr').removeClass('selected');
          var first_row = $(target).parent().parent();
          first_row.addClass('selecting_first');
          var initial_x = first_row.position().top;

          if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            event.stopPropagation();
            event.returnValue = false;
          }
        }

        $(document).mousemove(function(event){
          var target = event.target || event.srcElement;
          var targetElement = target.nodeName.toLowerCase();

          if (targetElement == "div" && $(target).parent().is('td')) {
            var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
            var current_row = $(target).parent().parent();
            var current_x = current_row.position().top;
            $(table).children('tbody').children('tr').removeClass('selecting');
            current_row.addClass('selecting');
            var find = false;
            var cursor = first_row;

            while (!find) {
              if (initial_x<current_x) {
                first_row.removeClass('selecting_last').addClass('selecting_first');
                if (cursor.attr('r')==current_row.attr('r')) {
                  cursor.addClass('selecting');
                  cursor.next().removeClass('selecting');
                  find=true;
                } else {
                  cursor.next().removeClass('selecting');
                  cursor.addClass('selecting');
                  cursor = cursor.next();
                }
              } else if (initial_x>current_x) {
                first_row.removeClass('selecting_first').addClass('selecting_last');
                if (cursor.attr('r')==current_row.attr('r')) {
                  cursor.addClass('selecting');
                  cursor.prev().removeClass('selecting');
                  find=true;
                } else {
                  cursor.prev().removeClass('selecting');
                  cursor.addClass('selecting');
                  cursor = cursor.prev();
                }
              } else {
                find=true;
                return false;
              }
            }

          } else {
          }
          if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            event.stopPropagation();
            event.returnValue = false;
          }
        });
      });
      $(document).mouseup(function(event){
        var target = event.target || event.srcElement;
        var targetElement = target.nodeName.toLowerCase();

        if (targetElement == "div" && $(target).parent().is('td')) {
          var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
          if ($('tbody tr').hasClass('selecting_last')) {
            $('tbody tr[r="'+data.row+'"]').addClass('selecting_first');
            $('tbody tr[r="'+data.row+'"]').addClass('border');
            $('tbody tr.selecting_last').addClass('border');
          } else {
            $('tbody tr[r="'+data.row+'"]').addClass('selecting_last').addClass('border');
            $('tbody tr.selecting_first').addClass('border');
          }

          if ($('tbody tr[r="'+data.row+'"]').hasClass('selecting_last') && $('tbody tr[r="'+data.row+'"]').hasClass('selecting_first')) {
            $('tbody tr[r="'+data.row+'"]').removeClass('selecting_first');
            $('tbody tr[r="'+data.row+'"]').removeClass('selecting_last');
            $('tbody tr[r="'+data.row+'"]').removeClass('border');
            $('tbody tr[r="'+data.row+'"]').removeClass('selecting');
            $('tbody tr[r="'+data.row+'"]').removeClass('editing');
            $('tbody tr[r="'+data.row+'"]').removeClass('selected');
          }
          if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          } else {
            event.stopPropagation();
            event.returnValue = false;
          }
        }
        $(document).unbind('mousemove');
      });



      ///////////////////////////////////////
      //  Editing table values             //
      ///////////////////////////////////////
       //Saving new edited value
      $("div.edit_cell a.save").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var row = $(this).attr('r');
        var column = $(this).attr('c');
        if ($('tbody tr td[r="'+row+'"][c="'+column+'"] div').text()!=$("div.edit_cell textarea").val()) {
          var new_value = $("div.edit_cell textarea").val();
          var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
          var params = {};
          params["row_id"] = row;
          params[column] = $("div.edit_cell textarea").val();
          params['column_id'] = column;
          methods.updateTable("/rows/"+row,params,new_value,old_value,'update_cell');
          $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text($("div.edit_cell textarea").val());
        }
        $("div.edit_cell").hide();
        $("div.edit_cell textarea").css('width','262px');
        $("div.edit_cell textarea").css('height','30px');
        $('tbody tr[r="'+row+'"]').removeClass('editing');
      });
      //Cancel editing value
      $("div.edit_cell a.cancel,div.edit_cell a.close").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var row = $('div.edit_cell a.save').attr('r');
        $("div.edit_cell").hide();
        $("div.edit_cell textarea").css('width','262px');
        $("div.edit_cell textarea").css('height','30px');
        $('tbody tr[r="'+row+'"]').removeClass('editing');
      });



      ///////////////////////////////////////
      //  Header options events            //
      ///////////////////////////////////////
      //Head options even
      $('thead tr a.options').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();

        if (!$(this).hasClass('selected')) {
          $('tbody tr td.first a.options').removeClass('selected');
          $('thead tr span.col_types').hide();
          $('thead tr a.options').removeClass('selected');
          $('thead tr span.col_ops_list').hide();
          $(this).addClass('selected');
          $(this).parent().children('span.col_ops_list').show();

          $('body').click(function(event) {
            if (!$(event.target).closest('thead tr span').length) {
              $('thead tr span.col_ops_list').hide();
              $('thead tr span.col_types').hide();
              $('thead tr a.options').removeClass('selected');
              $('body').unbind('click');
            };
          });
        } else {
          $(this).removeClass('selected');
          $(this).parent().children('span.col_ops_list').hide();
          $('body').unbind('click');
        }
      });
      $('thead tr a.column_type').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('thead tr th div span.col_ops_list').hide();
        $('thead tr span.col_types').hide();
        var position = $(this).position();
        $(this).parent().parent().children('span.col_types').css('top',position.top-5+'px');

        $(this).parent().parent().children('span.col_types').show();
        $('body').click(function(event) {
         if (!$(event.target).closest('thead tr span.col_types').length) {
           $('thead tr span.col_ops_list').hide();
           $('thead tr span.col_types').hide();
           $('thead tr a.options').removeClass('selected');
           $('body').unbind('click');
         };
        });
      });
      $('thead tr th div h3,thead tr th div input,thead tr span.col_types,thead tr span.col_ops_list').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
      });
      $('thead tr th div h3').dblclick(function(){
        var title = $(this);
        var input = $(this).parent().children('input');
        input.attr('value',title.text());

        function updateColumnName() {
          var old_value = title.text();
          var new_value = sanitizeText(input.attr('value'));

          if (old_value!=new_value && new_value.length>0) {
            var params = {};
            params["what"] = "modify";
            params.column={};
            params["column"].new_name = new_value;
            params["column"].old_name = old_value;
            params["column"].index = title.parent().parent().parent().index();
            methods.updateTable("/update_schema",params,new_value,old_value,'rename_column');
            input.parent().children('h3').text(new_value);
            input.hide();
            input.unbind('focusout');
            input.unbind('keydown');
          } else {
            input.hide();
            input.unbind('focusout');
            input.unbind('keydown');
          }
        }


        input.show().focus();
        input.keydown(function(ev){
          if (ev.which == 13) {
            ev.preventDefault();
            ev.stopPropagation();
            updateColumnName();
          }
        });
        input.focusout(function(){
          updateColumnName();
        });


      });
      $('thead a.rename_column').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $(this).closest('div').find('h3').trigger('dblclick');
      });
      $('thead a.change_data_type').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $(this).closest('div').find('a.column_type').trigger('click');
      });
      $('thead a.delete_column').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
      });
      //TODO change data type list values
      $('thead tr th').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).find('a.options').trigger('click');
      });
      
      
      ///////////////////////////////////////
      //  Georeference window events       //
      ///////////////////////////////////////
      $('a.open_georeference,p.geo').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        bindESC();
        //TODO desactivate component
        $('div.georeference_window span.select').addClass('disabled');
        $('div.georeference_window span.select a:eq(0)').text('Retreiving columns...').attr('c','');
        $('div.georeference_window a.confirm_georeference').addClass('disabled');
        $('div.georeference_window span.select').removeClass('clicked');
        
        $.ajax({
           method: "GET",
           url: '/api/json/tables/'+table_id+'/schema',
           success: function(data) {

             $(document).unbind('scroll');
             $('div.table_position').unbind('scroll');
             //Remove ScrollPane
             var custom_scrolls = [];
             $('.scrollPane').each(function(){
         					custom_scrolls.push($(this).jScrollPane().data().jsp);
         				}
         		  );
         		  $.each(custom_scrolls,function(i) {
                this.destroy();
              });
             $('div.georeference_window span.select ul li').remove();
             
             for (var i = 0; i<data.length; i++) {
               
               if (data[i][0]!="cartodb_id" && data[i][0]!="created_at" && data[i][0]!="updated_at") {
                 if (data[i][2]==undefined) {
                   $('div.georeference_window span.select ul').append('<li><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                 } else {
                   if (data[i][2]=="longitude") {
                     $('div.georeference_window span.select:eq(1) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                     $('div.georeference_window span.select:eq(0) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                     $('div.georeference_window span.select:eq(1) a.option').text(data[i][0]).attr('c',data[i][0]);
                   } else {
                     $('div.georeference_window span.select:eq(1) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                     $('div.georeference_window span.select:eq(0) ul').append('<li class="choosen"><a href="#'+data[i][0]+'">'+data[i][0]+'</a></li>');
                     $('div.georeference_window span.select:eq(0) a.option').text(data[i][0]).attr('c',data[i][0]);
                   }
                 }
               }
             }
             
             //$('div.georeference_window span.select .scrollPane').jScrollPane();
             $('div.georeference_window span.select').removeClass('disabled');

             $('div.georeference_window span.select a.option').each(function(i,ele){
               if ($(ele).text()=="Retreiving columns...") {
                  $(ele).text('Select a column').attr('c','');
                }
             });
             $('div.georeference_window a.confirm_georeference').removeClass('disabled');
           }
        });
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $('div.mamufas div.georeference_window').show();
        $('div.mamufas').fadeIn();
        
      });
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
      $('span.select ul li a').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('span.select').children('a.option').text($(this).text());
        $(this).closest('span.select').children('a.option').attr('c',$(this).text());
        $('span.select').removeClass('clicked');
        $('span.select ul li').removeClass('choosen');
        $('span.select ul li a:contains("'+$(this).text()+'")').parent().addClass('choosen');
      });
      $('a.confirm_georeference').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if ($('a#latitude').attr('c')!='' && $('a#longitude').attr('c')!='') {
          var params = {};
          params['lat_column'] = $('a#latitude').attr('c');
          params['lon_column'] = $('a#longitude').attr('c');
          $.ajax({
             type: "PUT",
             url: '/api/json/tables/'+table_id+'/set_geometry_columns',
             data: params,
             success: function(data) {
               console.log(data);
             }
          });
        } 
      });
      $('div.mamufas div.georeference_window a.close_delete').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.mamufas').fadeOut('fast',function(){
          $('div.mamufas div.delete_window').hide();
        });
        var document_events = $.data( $(document).get(0), 'events' ).click;
        console.log(document_events);
        for (var i=0; i<document_events.length; i++) {
          if (document_events[i].type=="scroll") {
            return false;
          }
        }
        methods.addScroll();
        unbindESC();
      });
      
      
      ///////////////////////////////////////
      //  SQL Editor                       //
      ///////////////////////////////////////
      // //SQL Editor
      $('div.general_options div.sql_console span a.close').livequery('click',function(){
        $('div.general_options div.sql_console').hide();
        $('div.general_options ul').removeClass('sql');
      });
      // General options
      $('div.general_options ul li a.sql').livequery('click',function(){
        $('div.general_options div.sql_console').show();
        $('div.general_options ul').addClass('sql');
      });



      ///////////////////////////////////////
      //  Move table -> left/right         //
      ///////////////////////////////////////
      $('span.paginate a.next').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var scrollable = $('div.table_position').scrollLeft();
        var window_width = $(window).width();
        var second = $('table thead tr th:eq(2)').position().left;
        var test_1 = $('table thead tr th:eq(3)').position().left;
        var test_2 = $('table thead tr th:eq(4)').position().left;
        var length = test_2 - test_1;

        try {
          var column_position = Math.floor(($(window).width()-second+scrollable)/(length))+3;
          var position = $('table thead tr th:eq('+column_position+')').offset().left;
          $('div.table_position').scrollTo({top:'0',left:scrollable+position-window_width+'px'},200);
        } catch (e) {
          $('div.table_position').scrollTo({top:'0',left:'100%'},200);
        }
      });
      $('span.paginate a.previous').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var scrollable = $('div.table_position').scrollLeft();
        var window_width = $(window).width();
        var second = $('table thead tr th:eq(2)').position().left;
        var test_1 = $('table thead tr th:eq(3)').position().left;
        var test_2 = $('table thead tr th:eq(4)').position().left;
        var length = test_2 - test_1;

        var column_position = Math.floor(($(window).width()-second+scrollable)/(length))+1;
        var position = $('table thead tr th:eq('+column_position+')').offset().left;
        $('div.table_position').scrollTo({top:'0',left:scrollable+position-window_width+'px'},200);
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  KEEP SIZE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    keepSize: function(){
      //Keep the parent table div with the correct width, onresize window as well
      if ($(window).width() != $('div.table_position').width()) {
        setTimeout(function(){
          methods.resizeTable();
        },500);
      }

      $(window).resize(function(ev){
        methods.resizeTable();
      });

    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  RESIZE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    resizeTable: function() {
      $('div.table_position').width($(window).width());
      var parent_width = $(window).width();
      var width_table_content = (($(table).children('thead').children('tr').children('th').size()-2)*(cell_size+27)) + 168;
      var head_element = $(table).children('thead').children('tr').children('th:last').children('div');
      var body_element = $(table).children('tbody').children('tr');

      //WIDTH
      if (parent_width>width_table_content) {
        $(head_element).width(parent_width - width_table_content + cell_size);
        $(body_element).each(function(index,element){
          $(element).children('td:last').children('div').width(parent_width-width_table_content + cell_size);
          last_cell_size = parent_width-width_table_content + cell_size;
        });
      }

      // HEIGTH
      var parent_height = $(window).height();
      if ((parent_height-162)>($(table).parent().height())) {
        $(table).parent().height(parent_height-162);
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  UPDATE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    updateTable: function(url_change,params,new_value,old_value,type) {
      //Queue loader
      var requestId = createUniqueId();
      params.requestId = requestId;
      requests_queue.newRequest(requestId,type);

      $.ajax({
        dataType: 'json',
        type: "PUT",
        url: '/api/json/tables/'+table_id+url_change,
        data: params,
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
          methods.successRequest(params,new_value,old_value,type);
        },
        error: function(e, textStatus) {
          requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          methods.errorRequest(params,new_value,old_value,type);
        }
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  SUCCESS UPDATING THE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    successRequest: function(params,new_value,old_value,type) {
      switch (type) {
        case "rename_column": $('tbody tr td[c="'+old_value+'"]').attr('c',new_value);
                              break;

        default:              break;
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  ERROR UPDATING THE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    errorRequest: function(params,new_value,old_value,type) {
      switch (type) {
        case "update_cell":   var element = $('table tbody tr[r="'+params.row_id+'"] td[c="'+params.column_id+'"] div');
                              element.text(old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#666666'},300);},1000);
                              });
                              break;

        case "rename_column": var element = $('table thead tr th:eq('+params.column.index+') h3');
                              element.text(old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#727272'},300);},1000);
                              });
                              break;

        default:              break;
      }
    }
  };



  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //  START PLUGIN
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  $.fn.cDBtable = function(method,options) {

    defaults = options;

    if (methods[method]) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      return methods.init.apply( this, arguments );
    }
  };
})( jQuery );

