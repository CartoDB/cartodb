
// FUNCIONALITIES
//   - Editing table data with events - O
//   - Resize columns -- KO
//   - Pagination with ajax --- OK
//   - Custom style --- OK
//   - jScrollPane
//   - Update table (remove columns and rows, add columns and rows, move columns, sort columns) - OK
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

  var first = true;
  var table;
  var loading = false;
  var headers = [];
  
  var minPage = 0;
  var maxPage = -1;
  var actualPage;
  var total;
  
  var defaults;
  var cell_size = 100;
  var last_cell_size = 100;

  var enabled = true;
  var methods = {


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  INIT PLUGIN
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init : function() {
      return this.each(function(){
        if (first) !first;
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
           if (window_width>((data.columns.length*113)+42)) {
             cell_size = ((window_width-150)/(data.columns.length-1))-27;
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
               if (window_width>((data.columns.length*113)+42)) {
                 cell_size = ((window_width-150)/(data.columns.length-1))-27;
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
      headers = [];
      
      $.each(data,function(index,element){
        headers[element[0]] = element[1];
        var column_types = '<span class="col_types">' +
                        '<p>'+element[1]+'</p>' +
                        '<ul>' +
                          '<li><a href="#String">String</a></li>' +
                          '<li><a href="#Number">Number</a></li>' +
                          '<li><a href="#Date">Date</a></li>' +
                          '<li><a href="#Boolean">Boolean</a></li>' +
                        '</ul>' +
                      '</span>';

        var col_ops_list = '<span class="col_ops_list">' +
                        '<h5>ORDER</h5>' +
                        '<ul>' +
                          '<li><a>Order by ASC</a></li>' +
                          '<li><a>Order by DESC</a></li>' +
                        '</ul>' +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<div class="line"></div>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<h5>EDIT</h5>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<ul>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="rename_column" href="#rename_column">Rename column</a></li>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="change_data_type" href="#change_data_type">Change data type</a></li>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="delete_column" href="#delete_column">Delete column</a></li>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'</ul>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<div class="line"></div>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<h5>GEOREFERENCE</h5>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<ul>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a href="#" class="open_georeference">Georeference with...</a></li>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'</ul>':'') +
                        '<div class="line"></div>'+
                        '<h5>CREATE</h5>' +
                        '<ul>' +
                          '<li class="last"><a href="#add_column" class="add_column">Add new column</a></li>' +
                        '</ul>' +
                      '</span>';
        thead += '<th c="'+element[0]+'" type="'+element[1]+'">'+
                    '<div '+((index==0)?'style="width:75px"':' style="width:'+cell_size+'px"') + '>'+
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
      
      if (first) {
        first = false;
        //Print correct column types
        methods.getColumnTypes();

        //Scroll event
        methods.addScroll();

        //Cell click event
        methods.bindEvents();

        //Create elements
        methods.createElements();
      }
      //closeAllWindows();
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
                                '<li><a class="delete_row" href="#">Delete row</a></li>' +
                              '</ul>' +
                              '<div class="line"></div>'+
                              '<h5>CREATE</h5>' +
                              '<ul>' +
                                '<li class="last"><a href="#" class="add_row">Add new row</a></li>' +
                              '</ul>' +
                            '</span>';
        tbody += '<tr r="'+element.cartodb_id+'"><td class="first" r="'+ element.cartodb_id +'"><div><a href="#" class="options">options</a>'+options_list+'</div></td>';
        $.each(element, function(j,elem){
          tbody += '<td '+((j=="cartodb_id" || j=="created_at" || j=="updated_at")?'class="special"':'')+' r="'+ element.cartodb_id +'" c="'+ j +'"><div '+((j=='cartodb_id')?'':' style="width:'+cell_size+'px"') + '>'+((elem==null)?'':elem)+'</div></td>';
        });
        
        var start = tbody.lastIndexOf('"width:');
        var end = tbody.lastIndexOf('px"');
        tbody = tbody.substring(0,start) + '"width:' + last_cell_size + tbody.substring(end);
        
        tbody += '</tr>';
      });


      if ($(table).children('tbody').length==0) {
        tbody += '</tbody>';
        $(table).append(tbody);
        methods.resizeTable();
      } else {
        (direction=="previous")?$(table).children('tbody').prepend(tbody):$(table).children('tbody').append(tbody);
      }
      
      methods.checkReuse(direction);
    },


    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  GET COLUMN TYPES AND PRINT THEM
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   
    getColumnTypes: function() {
      $.ajax({
         method: "GET",
         url: '/api/json/column_types',
         success: function(data) {
           $('span.col_types').each(function(index,element){
             $(element).children('ul').children('li').remove();
             for (var i = 0; i<data.length; i++) {
               $(element).children('ul').append('<li><a href="#'+data[i]+'">'+data[i]+'</a></li>');
             }
           });
         }
      });
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
            '<li><a href="#add_row" class="add_row"><span>Add row</span></a></li>'+
            '<li><a href="#add_column" class="add_column"><span>Add column</span></a></li>'+
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
          '<div class="inner">'+
            '<div class="free">'+
              '<textarea></textarea>'+
            '</div>'+
            '<div class="boolean">'+
              '<ul>'+
                '<li><a href="#True">True</a></li>'+
                '<li><a href="#False">False</a></li>'+
                '<li><a class="null" href="#Null">Null</a></li>'+
              '</ul>'+
            '</div>'+
            '<div class="date">'+
              '<div class="day">'+
                '<label>DAY</label>'+
                '<span class="bounds">'+
                  '<input value="1" />'+
                  '<a class="up" href="#one_day_more">up</a>'+
                  '<a class="down" href="#one_day_less">dowm</a>'+
                '</span>'+
              '</div>'+
              '<div class="month">'+
                '<label>MONTH</label>'+
                '<span class="bounds">'+
                  '<a href="#...x">January</a>'+
                '</span>'+
                '<div class="months_list">'+
                  '<ul class="scroll-pane">'+
                    '<li><a href="#January">January</a></li>'+
                    '<li><a href="#February">February</a></li>'+
                    '<li><a href="#March">March</a></li>'+
                    '<li><a href="#April">April</a></li>'+
                    '<li><a href="#May">May</a></li>'+
                    '<li><a href="#June">June</a></li>'+
                    '<li><a href="#July">July</a></li>'+
                    '<li><a href="#August">August</a></li>'+
                    '<li><a href="#September">September</a></li>'+
                    '<li><a href="#October">October</a></li>'+
                    '<li><a href="#November">November</a></li>'+
                    '<li><a href="#December">December</a></li>'+
                  '</ul>'+
                '</div>'+
              '</div>'+
              '<div class="year">'+
                '<label>YEAR</label>'+
                '<span class="bounds">'+
                  '<input value="2011" />'+
                  '<a class="up" href="#one_year_more">up</a>'+
                  '<a class="down" href="#one_year_less">dowm</a>'+
                '</span>'+
              '</div>'+
              '<div class="hour">'+
                '<label>TIME</label>'+
                '<span class="bounds">'+
                  '<input value="14:13:13" />'+
                '</span>'+
              '</div>'+
            '</div>'+
          '</div>'+
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
      
      
      //Row delete tooltip
      $(table).parent().append(
        '<div class="delete_row">'+
          '<p>You are about to delete this row. Are you sure?</p>'+
          '<a class="cancel_delete" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#delete_row">Yes, delete it</a>'+
        '</div>'
      );
      
      
      //Column delete tooltip
      $(table).parent().append(
        '<div class="delete_column">'+
          '<p>You are about to delete this column. Are you sure?</p>'+
          '<a class="cancel_delete" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#delete_column">Yes, delete it</a>'+
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
      enabled = false;
      
      $(table).parent().append(
        '<div class="empty_table">'+
          '<h5>Add some rows to your table</h5>'+
          '<p>You can <a class="add_row" href="#add_row">add it manually</a> or <a href="#">import a file</a></p>'+
        '</div>'
      );
      methods.resizeTable();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CREATE NEW ROW
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    addRow: function() {
      var requestId = createUniqueId();
      var type = 0;
      requests_queue.newRequest(requestId,'add_row');
      
      
      if ($('div.empty_table').length>0) {
        type = 0;
      } else {
        type = 1;
        // getDataUrl: '/api/json/tables/'+table_id,
        // resultsPerPage: 50,
        // reuseResults: 100,
        // total: 5000
        
        // var minPage = 0;
        // var maxPage = -1;
        // var actualPage;
        // var total;
        
        //if () {
        //} else {
          //Ir a la última página - Poner mamufas cargando - desaactivar durante el mamufas cargando - meter clase a la tabla para que se quede en la mitad
        //}
      }
      
      
        
      $.ajax({
         type: "POST",
         url: '/api/json/tables/'+table_id+'/rows',
         success: function(data) {
           row_id = data.id;
           $.ajax({
              method: "GET",
              url: '/api/json/tables/'+table_id+'/schema',
              success: function(data) {
                requests_queue.responseRequest(requestId,'ok','');
                var options_list = '<span><h5>EDIT</h5><ul><li><a href="#">Duplicate row</a></li><li><a href="#">Delete row</a></li></ul>' +
                                    '<div class="line"></div><h5>CREATE</h5><ul><li class="last"><a href="#" class="add_row">Add new row</a></li>' +
                                    '</ul></span>';
                                    
                if (type==0) {
                  var row = '<tbody style="padding-top:52px"><tr r="'+row_id+'"><td class="first" r="'+row_id+'"><div><a href="#" class="options">options</a>'+options_list+'</div></td>';
                } else {
                  var row = '<tr r="'+row_id+'"><td class="first" r="'+row_id+'"><div><a href="#" class="options">options</a>'+options_list+'</div></td>';
                }
                                 

                for (var i = 0; i<data.length; i++) {
                  var text = '';
                  if (data[i][0]=="cartodb_id") {
                    text = row_id;
                  } else if (data[i][0]=="created_at" || data[i][0]=="updated_at") {
                    var date = new Date();
                    text = date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+' '+date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
                  } else {
                    text = '';
                  }
                  row += '<td '+((data[i][0]=="cartodb_id" || data[i][0]=="created_at" || data[i][0]=="updated_at")?'class="special"':'')+' r="'+row_id+'"  c="'+ data[i][0] +'"><div '+((data[i][0]=='cartodb_id')?'':' style="width:'+cell_size+'px"') + '>'+text+'</div></td>';
                }
                
                var start = row.lastIndexOf('"width:');
                var end = row.lastIndexOf('px"');
                row = row.substring(0,start) + '"width:' + last_cell_size + row.substring(end);
                
                if (type==0) {
                  row += '</tr></tbody>';
                  $(table).append(row);
                } else {
                  row += '</tr>';
                  $(table).children('tbody').append(row);
                }
                
                $('div.empty_table').remove();
                methods.resizeTable();
              },
              error: function(e) {
                requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
              }
           });
         }
      });
      
      
      //Activamos la tabla
      enabled = true;
    },
    
    
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CREATE NEW COLUMN
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    addColumn: function(name,type) {
      var params = {};
      params['what'] = "add";
      params['column'] = {};
      params['column']['name'] = sanitizeText(name);
      params['column']['type'] = type.charAt(0).toUpperCase() + type.slice(1);

      methods.updateTable('/update_schema',params,params.column,null,"new_column","PUT");
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
          $('section.subheader').css('top','-3px');
          $(table).children('thead').css('top','99px');
        } else {
          $('section.subheader').css('top',58-$(document).scrollTop()+'px');
          $(table).children('thead').css('top',160-$(document).scrollTop()+'px');
        }


        //For paginating data
        if (!loading && enabled) {
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
    //  BIND EVENTS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    bindEvents: function() {
      
      ///////////////////////////////////////
      //  TABLE REFRESH OR ENABLED         //
      ///////////////////////////////////////
      $('body').livequery('enabled',function(event,status){
        enabled = status;
      });
      $('body').livequery('refresh',function(event){
        methods.refreshTable();
      });
      

      ///////////////////////////////////////
      //  DOUBLE CLICK -> Open editor      //
      ///////////////////////////////////////
      $(document).dblclick(function(event){
        if (enabled) {
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


            var type = headers[data.column];
            $('div.edit_cell div.free').hide();
            $('div.edit_cell div.boolean').hide();
            $('div.edit_cell div.date').hide();
            $('div.table_position div.edit_cell div.boolean ul li').removeClass('selected');
            
            
            if (type=="date") {
              var date = parseDate(data.value);
              $('div.edit_cell div.date div.day input').val(date.day);
              $('div.edit_cell div.date div.month span.bounds a').text(date.month_text);
              $('div.edit_cell div.date div.year input').val(date.year);
              $('div.edit_cell div.date div.hour input').val(date.time);
              $('div.edit_cell div.date').show();
            } else if (type=="boolean") {
              if (data.value == "true") {
                $('div.table_position div.edit_cell div.boolean ul li a:contains("True")').parent().addClass('selected');
              } else if (data.value == "false") {
                $('div.table_position div.edit_cell div.boolean ul li a:contains("False")').parent().addClass('selected');
              } else {
                $('div.table_position div.edit_cell div.boolean ul li a:contains("Null")').parent().addClass('selected');
              }
              $('div.edit_cell div.boolean').show();
            } else {
              $('div.edit_cell div.free').show();
              $('div.edit_cell textarea').text(data.value);
            }
            
            $('div.edit_cell a.save').attr('r',data.row);
            $('div.edit_cell a.save').attr('c',data.column);
            $('div.edit_cell a.save').attr('type',type);
            $('div.edit_cell').show();
            

            if (event.preventDefault) {
              event.preventDefault();
              event.stopPropagation();
            } else {
              event.stopPropagation();
              event.returnValue = false;
            }
          }
        }

      });



      ///////////////////////////////////////
      //  SIMPLE CLICK -> Open editor      //
      ///////////////////////////////////////
      $(document).click(function(event){
        if (enabled) {
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
              $('body').click(function(event) {
                if (!$(event.target).closest('tbody tr td div span').length) {
                  $('table tbody tr').removeClass('editing');
                  $('body').unbind('click');
                };
              });
            }

            if (!$(target).hasClass('selected')) {
              $('tbody tr td.first div span').hide();
              $('tbody tr td.first div a.options').removeClass('selected');
              $(target).parent().children('span').show();
              $(target).addClass('selected');

              $('body').click(function(event) {
                if (!$(event.target).closest('tbody tr td div span').length) {
                  $('table tbody tr td.first div a.options').removeClass('selected');
                  $('table tbody tr').removeClass('editing');
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
        } 
      });



      ///////////////////////////////////////
      //  Editing selected rows            //
      ///////////////////////////////////////
      $(document).mousedown(function(event){
        if (enabled) {
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
        }
      });
      $(document).mouseup(function(event){
        if (enabled) {
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
        }
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
        var type = $(this).attr('type');
        var params = {};
        params['column_id'] = column;
        params["row_id"] = row;
        
        
        if (type == "boolean") {
          if ($('tbody tr td[r="'+row+'"][c="'+column+'"] div').text().toLowerCase()!=$("div.edit_cell div.boolean ul li.selected a").text().toLowerCase()) {
            var new_value = $("div.edit_cell div.boolean ul li.selected a").text().toLowerCase();
            var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
            if (new_value == 'null') {
              $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text('');
            } else {
              $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text(new_value);
            }
          }
        } else if (type=="date") {
          if ($("div.edit_cell div.date div.hour input").hasClass('error')) {
            return false;
          } else {
            var month = getMonthNumber($('div.edit_cell div.date div.month span.bounds a').text());
            var day = $('div.edit_cell div.date div.day input').val();
            var year = $('div.edit_cell div.date div.year input').val();
            var hour = $('div.edit_cell div.date div.hour input').val();
            var new_value = year+'-'+month+'-'+day+ ' '+hour;
            var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
            $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text(new_value);
          }
        } else {
          if ($('tbody tr td[r="'+row+'"][c="'+column+'"] div').text()!=$("div.edit_cell textarea").val()) {
            var new_value = $("div.edit_cell textarea").val();
            var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
            $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text(new_value);
          }
        }
        
        params[column] = new_value;
        methods.updateTable("/rows/"+row,params,new_value,old_value,'update_cell',"PUT");
        
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
      $("div.edit_cell div.boolean ul li a").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $("div.edit_cell div.boolean ul li").removeClass('selected');
        $(this).parent().addClass('selected');
      });
      
      $('div.edit_cell div.date div.day input').livequery('keyup',function(){
        var value=$(this).val();
        var orignalValue=value;
       	value=value.replace(/\./, "");
        orignalValue=orignalValue.replace(/([^0-9].*)/g, "");
        $(this).val(orignalValue.substr(0,2));
      });
      $('div.edit_cell div.date div.day input').livequery('focusout',function(){
        if ($(this).val()=='') {$(this).val(1)}
      });
      $("div.edit_cell div.date div.day a.up").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var input_value = $(this).parent().find('input').val();
        if (input_value < 31) {
          $('div.edit_cell div.date div.day input').val(parseInt(input_value)+1);
        }
      });
      $("div.edit_cell div.date div.day a.down").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var input_value = $(this).parent().find('input').val();
        if (input_value > 1) {
          $('div.edit_cell div.date div.day input').val(parseInt(input_value)-1);
        }
      });
      
      $('div.edit_cell div.date div.year input').livequery('keyup',function(){
        var value=$(this).val();
        var orignalValue=value;
       	value=value.replace(/\./, "");
        orignalValue=orignalValue.replace(/([^0-9].*)/g, "");
        $(this).val(orignalValue.substr(0,4));
      });
      $('div.edit_cell div.date div.year input').livequery('focusout',function(){
        if ($(this).val()=='') {$(this).val(2011)}
      });
      $("div.edit_cell div.date div.year a.up").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var input_value = $(this).parent().find('input').val();
        if (input_value < 9999) {
          $('div.edit_cell div.date div.year input').val(parseInt(input_value)+1);
        }
      });
      $("div.edit_cell div.date div.year a.down").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var input_value = $(this).parent().find('input').val();
        if (input_value > 1) {
          $('div.edit_cell div.date div.year input').val(parseInt(input_value)-1);
        }
      });

      $("div.edit_cell div.date div.hour input").livequery('keyup',function(){
          var pattern = /([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;
          if (pattern.test($(this).val())) {
            $(this).removeClass('error');
          } else {
            $(this).addClass('error');
          }
      });
      
      $("div.edit_cell div.date div.month span.bounds a").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $("div.months_list ul").jScrollPane();
        
        var custom_scrolls = [];
        $('.scrollPane').each(function(){
          custom_scrolls.push($(this).jScrollPane().data().jsp);
        });
        $.each(custom_scrolls,function(i) {
          this.destroy();
        });
        $("ul.scroll-pane").jScrollPane();
        
        $(this).parent().parent().children('div.months_list').show();
        $('body').click(function(event) {
          if (!$(event.target).closest('div.months_list').length) {
            $('div.months_list').hide();
            $('body').unbind('click');
          };
        });
      });
      $("div.months_list ul li a").livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div.month').children('span.bounds').children('a').text($(this).text())
        $(this).closest('div.months_list').hide();
      });     
      
      
      ///////////////////////////////////////
      //  Header options events            //
      ///////////////////////////////////////
      //Head options even
      $('thead tr a.options').livequery('click',function(ev){
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
      $('thead tr a.column_type').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('thead tr th div a.options').removeClass('selected');
        $('thead tr th div span.col_ops_list').hide();
        $('thead tr span.col_types').hide();
        $('div.edit_cell').fadeOut();
        var position = $(this).position();
        $(this).parent().parent().children('span.col_types').find('li').removeClass('selected');
        var column_type = $(this).parent().parent().children('p.long').children('a').text();
        column_type = column_type.charAt(0).toUpperCase() + column_type.slice(1);
        $(this).parent().parent().children('span.col_types').children('p').text(column_type);
        $(this).parent().parent().children('span.col_types').children('ul').children('li').children('a:contains("'+column_type+'")').parent().addClass('selected');
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
      $('span.col_types ul li a').livequery('click',function(){
        var parent_element = $(this).closest('span.col_types').parent().children('p.long').children('a');

        if ($(this).text().toLowerCase()!=parent_element.text()) {
          var old_value = parent_element.text();
          var new_value = $(this).text().toLowerCase();
          var column = $(this).closest('th').attr('c');
          parent_element.text(new_value);
          var params = {};
          params['what'] = "modify";
          params['column'] = {};
          params['column']['name'] = column;
          params['column']['type'] = new_value;

          methods.updateTable('/update_schema',params,new_value,old_value,"column_type","PUT");
        }
        $('thead tr span.col_types').hide();
      });
      $('thead tr th div h3,thead tr th div input,thead tr span.col_types,thead tr span.col_ops_list').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        
        
      });
      $('thead tr th div h3').livequery('dblclick',function(){
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
            methods.updateTable("/update_schema",params,new_value,old_value,'rename_column',"PUT");
            input.parent().children('h3').text(new_value);
            input.closest('th').attr('c',new_value);
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
      $('thead a.rename_column').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $(this).closest('div').find('h3').trigger('dblclick');
      });
      $('thead a.change_data_type').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $(this).closest('div').find('a.column_type').trigger('click');
      });
      $('thead a.delete_column').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        var column = $(this).closest('th').attr('c');
        var left_position = $(table).find('th[c="'+column+'"]').position().left;
        var options_position = $(table).find('th[c="'+column+'"]').find('a.options').position().left;

        $('div.delete_column a.button').attr('c',column);
        $('div.delete_column').css('left',left_position+options_position-97+'px');
        $('div.delete_column').show();

        $('body').click(function(event) {
         if (!$(event.target).closest('div.delete_column').length) {
           $('div.delete_column').hide();
           $('body').unbind('click');
         };
        });
      });
      $('div.delete_column a.cancel_delete, div.delete_row a.cancel_delete').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $('div.delete_column').hide();
        $('div.delete_row').hide();
      });
      $('div.delete_column a.button').livequery('click',function(ev){
        var column = $(this).attr('c');
        var params = {};
        params['what'] = "drop";
        params['column'] = {};
        params['column']['name'] = column;
        params['column']['type'] = '';
        $('body').trigger('click');
        methods.updateTable('/update_schema',params,params.column,null,"delete_column","PUT");
      });
      //TODO change data type list values
      $('thead tr th').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).find('a.options').trigger('click');
      });
      
      
      ///////////////////////////////////////
      //  Georeference window events       //
      ///////////////////////////////////////
      $('a.open_georeference,p.geo').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        enabled = false;
        
        $('div.column_window').hide();
        $('div.georeference_window span.select').addClass('disabled');
        $('div.georeference_window span.select a:eq(0)').text('Retrieving columns...').attr('c','');
        $('div.georeference_window a.confirm_georeference').addClass('disabled');
        $('div.georeference_window span.select').removeClass('clicked');
        
        $.ajax({
           method: "GET",
           url: '/api/json/tables/'+table_id+'/schema',
           success: function(data) {

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
             $('div.georeference_window span.select:eq(1) ul').append('<li><a href="#no_geo">Empty</a></li>');
             $('div.georeference_window span.select:eq(0) ul').append('<li><a href="#no_geo">Empty</a></li>');
             $('div.georeference_window span.select').removeClass('disabled');

             $('div.georeference_window span.select a.option').each(function(i,ele){
               if ($(ele).text()=="Retrieving columns...") {
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
      $('div.georeference_window span.select a.option').livequery('click',function(ev){
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
      $('div.georeference_window span.select ul li a').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('span.select').children('a.option').text($(this).text());
        $(this).closest('span.select').children('a.option').attr('c',$(this).text());
        $('span.select').removeClass('clicked');

        if ($(this).text()=="Empty") {
          $(this).parent().parent().children('li').removeClass('choosen');
          $(this).parent().addClass('choosen');
        } else {
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
        }
      });
      $('a.confirm_georeference').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var latitude = $('a#latitude').attr('c');
        var longitude = $('a#longitude').attr('c');
        if (!(latitude=='' && longitude=='')) {
          var params = {};
          params['lat_column'] = (latitude=="Empty")? "nil" : latitude;
          params['lon_column'] = (longitude=="Empty")? "nil" : longitude;
          methods.updateTable("/set_geometry_columns",params,null,null,'update_geometry',"PUT");
        } else {
          $('div.georeference_window p.error').text('You have to select latitude and longitude');
          $('div.georeference_window p.error').css('opacity',0);
          $('div.georeference_window p.error').css('display','block');
          $('div.georeference_window p.error').fadeTo(300,1);
          $('div.georeference_window p.error').delay(3000).fadeTo(300,0,function(){
            $('div.georeference_window p.error').css('display','none');
          });
        }
      });
      $('div.mamufas div.georeference_window a.close_delete').livequery('click',function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        enabled = true;
        closeAllWindows();
      });
      
      
      ///////////////////////////////////////
      //  Add row events                   //
      ///////////////////////////////////////
      $('a.add_row').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        methods.addRow();
      });
      $('a.delete_row').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        var cartodb_id = $(this).closest('tr').attr('r');
        $('body').trigger('click');
        
        var top_position = $(table).find('tr[r="'+cartodb_id+'"]').position().top;

        $('div.delete_row a.button').attr('r',cartodb_id);
        $('div.delete_row').css('top',top_position-7+'px');
        $('div.delete_row').show();

        $('body').click(function(event) {
         if (!$(event.target).closest('div.delete_row').length) {
           $('div.delete_row').hide();
           $('body').unbind('click');
         };
        });
        
      });
      $('div.delete_row a.button').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        var row = $(this).attr('r');
        var params = {};
        params.row = row;
        $('body').trigger('click');
        methods.updateTable('/rows/'+row,params,null,null,"delete_row","DELETE");
      });
      
      
      ///////////////////////////////////////
      //  Add column events                //
      ///////////////////////////////////////
      $('a.add_column').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        $('body').trigger('click');
        enabled = false;
        
        $('div.column_window span.select').removeClass('error');
        $('div.column_window input').removeClass('error');
        $('div.column_window span.select').addClass('disabled');
        $('div.column_window span.select a:eq(0)').text('Retreiving types...').attr('type','');
        $('div.column_window a.column_add').addClass('disabled');
        $('div.column_window span.select').removeClass('clicked');
        
        $.ajax({
           method: "GET",
           url: '/api/json/column_types',
           success: function(data) {
             //Remove ScrollPane
             var custom_scrolls = [];
             $('.scrollPane').each(function(){
               custom_scrolls.push($(this).jScrollPane().data().jsp);
             });
             $.each(custom_scrolls,function(i) {
              this.destroy();
              });
             $('div.column_window span.select ul li').remove();
             for (var i = 0; i<data.length; i++) {
               $('div.column_window span.select ul').append('<li><a href="#'+data[i]+'">'+data[i]+'</a></li>');
             }
             $('div.column_window span.select').removeClass('disabled');
             
             $('div.column_window span.select a.option').each(function(i,ele){
               if ($(ele).text()=="Retreiving types...") {
                  $(ele).text('Select a type').attr('type','');
                }
             });
             $('div.column_window a.column_add').removeClass('disabled');
           }
        });

        $('div.mamufas div.column_window').show();
        $('div.mamufas').fadeIn();
        
        //methods.addColumn();
      });
      $('div.column_window span.select a.option').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        if ($(this).parent().hasClass('clicked')) {
          $(this).parent().removeClass('clicked');
        } else {
          $('div.column_window span.select').removeClass('clicked');
          $(document).bind('click',function(ev){
            if (!$(ev.target).closest('span.select').length) {
              $('div.column_window span.select').removeClass('clicked');
            };
          });
          $(this).parent().addClass('clicked');
          $(this).parent().find('ul').jScrollPane();
        }
      });
      $('div.column_window span.select ul li a').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        $(this).closest('span.select').children('a.option').text($(this).text());
        $(this).closest('span.select').children('a.option').attr('type',$(this).text());
        $('div.column_window span.select').removeClass('clicked');
      });
      $('a.column_add').livequery('click',function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        if ($('div.column_window input').attr('value')!='' && $('div.column_window a.option').attr('type')!='') {
          methods.addColumn($('div.column_window input').attr('value'),$('div.column_window a.option').attr('type'));
          $('div.column_window input').attr('value','');
        } else {
          if ($('div.column_window input').attr('value')=='' && $('div.column_window a.option').attr('type')=='') {
            $('div.column_window span.select,div.column_window input').addClass('error');
            var position = $('div.column_window input').position().top;
            $('div.column_window p.error').css('top',position-32+'px');
            $('div.column_window p.error span').text('Choose a name and type');
          } else {
            if ($('div.column_window input').attr('value')=='') {
              $('div.column_window input').addClass('error');
              var position = $('div.column_window input').position().top;
              $('div.column_window p.error').css('top',position-32+'px');
              $('div.column_window p.error span').text('Choose a name');
            } else {
              var position = $('div.column_window span.select').position().top;
              $('div.column_window p.error').css('top',position-32+'px');
              $('div.column_window span.select').addClass('error');
              $('div.column_window p.error span').text('Choose a type');
            }
          }
          $('div.column_window p.error').fadeIn().delay(3000).fadeOut();
          
        }
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
      var width_table_content = (($(table).children('thead').children('tr').children('th').size()-2)*(cell_size+27)) + 140;
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
        $('span.end_table').css('bottom','-3px');
        $(table).parent().height(parent_height-162);
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  UPDATE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    updateTable: function(url_change,params,new_value,old_value,type,request_type) {
      //Queue loader
      var requestId = createUniqueId();
      params.requestId = requestId;
      requests_queue.newRequest(requestId,type);

      $.ajax({
        dataType: 'json',
        type: request_type,
        url: '/api/json/tables/'+table_id+url_change,
        data: params,
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
          methods.successRequest(params,new_value,old_value,type);
        },
        error: function(e, textStatus) {
          try {
            requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','Seems like you don\'t have Internet connection');
          }
          methods.errorRequest(params,new_value,old_value,type);
        }
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  SUCCESS UPDATING THE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    successRequest: function(params,new_value,old_value,type) {
      switch (type) {
        case "rename_column":   var type  = headers[old_value];
                                delete headers[old_value];
                                headers[new_value] = type;
                                $('tbody tr td[c="'+old_value+'"]').attr('c',new_value);
                                break;
        case "column_type":     headers[params.column.name] = params.column.type;
                                break;
        case "update_geometry": $('p.geo').remove();
                                $('thead tr th h3:contains('+params.lat_column+')').parent().append('<p class="geo latitude">geo</p>');
                                $('thead tr th h3:contains('+params.lon_column+')').parent().append('<p class="geo longitude">geo</p>');
                                closeAllWindows();
                                break;
        case "new_column":      closeAllWindows();
                                headers[params.column.name] = params.column.type;
                                methods.refreshTable();
                                break;
        case "delete_column":   delete headers[params.column.name];
                                methods.refreshTable();
                                break;                                
        case "delete_row":      methods.refreshTable();
                                break;                        
        default:                break;
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
                              element.closest('th').attr('c',old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#727272'},300);},1000);
                              });
                              break;
        case "update_geometry": closeAllWindows();
                              break;
        
        case "column_type":   var element = $('th[c="'+params.column.name+'"]').find('p.long').children('a');
                              element.text(old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#b4b4b4'},300);},1000);
                              });
                              break;
        case "new_column":    closeAllWindows();
        default:              break;
      }
    },
  
  
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  REFRESH TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refreshTable: function() {
      loading = true;
      minPage = 0;
      maxPage = -1;
      $(table).children('thead').remove();
      $(table).children('tbody').remove();
      methods.getData(defaults, 'next');
      enabled = true;
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