
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
// - mamufas

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
  
  var previous_scroll = 0;
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
     var petition_pages;
     if (direction=="next") {
       maxPage++;
       actualPage = maxPage;
       petition_pages = actualPage;
     } else if (direction=="previous") {
       minPage--;
       actualPage = minPage;
       petition_pages = actualPage;
     } else {
       enabled = false;
       petition_pages = minPage +'..'+ maxPage;
     }


     $.ajax({
       method: "GET",
       url: options.getDataUrl,
       data: {
         rows_per_page: options.resultsPerPage,
         page: petition_pages,
         query: options.query
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
                          '<li class="disabled"><a>Order by ASC</a></li>' +
                          '<li class="disabled"><a>Order by DESC</a></li>' +
                        '</ul>' +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<div class="line"></div>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<h5>EDIT</h5>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<ul>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="rename_column" href="#rename_column">Rename column</a></li>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="change_data_type" href="#change_data_type">Change data type</a></li>':'') +
                          ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a class="delete_column" href="#delete_column">Delete column</a></li>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'</ul>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<div class="line geo_line"></div>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<h5>GEOREFERENCE</h5>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<ul class="geo_list">':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'<li><a href="#" class="open_georeference">Georeference with...</a></li>':'') +
                        ((element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at")?'</ul>':'') +
                        '<div class="line"></div>'+
                        '<h5>CREATE</h5>' +
                        '<ul>' +
                          '<li class="last"><a href="#add_column" class="add_column">Add new column</a></li>' +
                        '</ul>' +
                      '</span>';
        thead += '<th c="'+element[0]+'" type="'+element[1]+'">'+
                    '<div '+((element[0]=="cartodb_id")?'style="width:75px"':' style="width:'+cell_size+'px"') + '>'+
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
        var tbody = '<tbody style="padding-top:53px;">';
      } else {
        var tbody = '';
      }


      //Loop all the data
      $.each(data, function(i,element){
        var options_list =  '<span>' +
                              '<h5>EDIT</h5>' +
                              '<ul>' +
                                '<li class="disabled"><a>Duplicate row</a></li>' +
                                '<li><a class="delete_row" href="#delete_row">Delete row</a></li>' +
                              '</ul>' +
                              '<div class="line"></div>'+
                              '<h5>CREATE</h5>' +
                              '<ul>' +
                                '<li class="last"><a href="#add_row" class="add_row">Add new row</a></li>' +
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
      
      if (direction!='') {
        methods.checkReuse(direction);
      } else {
        $(window).scrollTo({top:previous_scroll+'px',left:'0'},300,{onAfter: function() {loading = false; enabled = true;}});
      }
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
            '<li><a class="sql" href="#open_sql"><span>SQL</span></a></li>'+
            '<li><a href="#add_row" class="add_row"><span>Add row</span></a></li>'+
            '<li><a href="#add_column" class="add_column"><span>Add column</span></a></li>'+
            '<li><a><span class="dropdown">Views (2)</span></a></li>'+
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
              '<a class="try_query">Try query</a>'+
              '<a class="save_query">Save this query</a>'+
            '</span>'+
          '</div>'+
        '</div>');

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
            '<p class="error"><span>Write a correct time</span></p>'+
          '</div>'+
          '<span>'+
            '<a class="cancel" href="#">Cancel</a>'+
            '<a class="save" href="#">Save changes</a>'+
          '</span>'+
        '</div>');
      

      //Row delete tooltip
      $(table).parent().append(
        '<div class="delete_row">'+
          '<p>You are about to delete this row. Are you sure?</p>'+
          '<a class="cancel_delete" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#delete_row">Yes, delete it</a>'+
        '</div>');
      
      
      //Column delete tooltip
      $(table).parent().append(
        '<div class="delete_column">'+
          '<p>You are about to delete this column. Are you sure?</p>'+
          '<a class="cancel_delete" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#delete_column">Yes, delete it</a>'+
        '</div>');
      
      
      //Mamufas elements belong to the carto table
      $('div.mamufas').append(
        '<div class="georeference_window">'+
          '<a href="#close_window" class="close_geo"></a>'+
          '<div class="inner_">'+
            '<span class="loading">'+
               '<h5>We are georeferencing your columns...</h5>'+
               '<p>Just some seconds, ok?</p>'+
             '</span>'+
          
            '<span class="top">'+
              '<h3>Choose your geocoding method for this column</h3>'+
              '<p>Please select the columns for the lat/lon fields</p>'+
              '<ul class="main_list">'+
                '<li class="first_list selected">'+
                  '<a class="first_ul" href="#lat_lng_column">This is a lat/lon column</a>'+
                  '<div class="select">'+
                    '<label>LATITUDE COLUMN</label>'+
                    '<span class="select latitude">'+
                      '<a id="latitude" class="option" href="#column_name" c="">Retrieving columns...</a>'+
                      '<div class="select_content">'+
                        '<ul class="scrollPane"></ul>'+
                      '</div>'+
                    '</span>'+
                  '</div>'+
                  '<div class="select longitude last">'+
                    '<label>LONGITUDE COLUMN</label>'+
                    '<span class="select longitude">'+
                      '<a id="longitude" class="option" href="#column_name" c="">Retrieving columns...</a>'+
                      '<div class="select_content">'+
                        '<ul class="scrollPane"></ul>'+
                      '</div>'+
                    '</span>'+
                  '</div>'+
                '</li>'+
                '<li class="first_list">'+
                  '<a class="first_ul" href="#choose_address">Choose or create an address column</a>'+
                  '<div class="address_option">'+
                    '<p>Choose the column you want to combine for georeferencing your data.</p>'+
                    '<div class="first_column_address block">'+
                      '<label>SELECTED COLUMN 1</label>'+
                      '<span class="select address">'+
                        '<a class="option" href="#column_name" c="">Retrieving columns...</a>'+
                        '<div class="select_content">'+
                          '<ul class="scrollPane"></ul>'+
                        '</div>'+
                      '</span>'+
                      '<a class="remove_column" href="#remove_column"></a>'+
                    '</div>'+
                    '<div class="second_column_address block">'+
                      '<label>SELECTED COLUMN 2</label>'+
                      '<span class="select address">'+
                        '<a class="option" href="#column_name" c="">Retrieving columns...</a>'+
                        '<div class="select_content">'+
                          '<ul class="scrollPane"></ul>'+
                        '</div>'+
                      '</span>'+
                      '<a class="remove_column" href="#remove_column"></a>'+
                    '</div>'+
                    '<div class="third_column_address block">'+
                      '<label>SELECTED COLUMN 3</label>'+
                      '<span class="select address">'+
                        '<a class="option" href="#column_name" c="">Retrieving columns...</a>'+
                        '<div class="select_content">'+
                          '<ul class="scrollPane"></ul>'+
                        '</div>'+
                      '</span>'+
                      '<a class="remove_column" href="#remove_column"></a>'+
                    '</div>'+
                  '</div>'+
                '</li>'+
                '<li class="first_list disabled"><a>KML or PostGIS geometry</a></li>'+
              '</ul>'+
              '<p class="error">You have to select latitude and longitude</p>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#confirm_georeference" class="confirm_georeference">Georeference</a>'+
            '</span>'+
          '</div>'+
        '</div>'+
        '<div class="column_window">'+
          '<a href="#close_window" class="close_create"></a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>Add a new column</h3>'+
              '<p>Configure your new column.</p>'+
              '<div class="options">'+
                '<label>COLUMN NAME</label>'+
                '<input type="text" value=""/>'+
                '<label>COLUMN TYPE</label>'+
                '<span class="select">'+
                  '<a class="option" href="#select_type">Retrieving types...</a>'+
                  '<div class="select_content">'+
                    '<ul class="scrollPane"></ul>'+
                  '</div>'+
                '</span>'+
              '</div>'+
              '<p class="error"><span>Choose a name and type</span></p>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#add_column" class="column_add">Create</a>'+
            '</span>'+
          '</div>'+
        '</div>'+
        '<div class="lastpage_window">'+
          '<div class="inner_">'+
            '<span class="loading">'+
              '<h5>We are redirecting you to the end of your table...</h5>'+
              '<p>Is not gonna be a lot of time. Just some seconds, right?</p>'+
            '</span>'+
          '</div>'+
        '</div>'+
        '<div class="stopgeo_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="stop">'+
              '<h5>You are referencing by another column</h5>'+
              '<p>If you don\'t want to wait, <a href="#cancel_geo" class="cancel_geo">cancel de process</a> in progress.</p>'+
            '</span>'+
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
      enabled = false;
      
      $(table).parent().append(
        '<div class="empty_table">'+
          '<h5>Add some rows to your table</h5>'+
          '<p>You can <a class="add_row" href="#add_row">add it manually</a> or <a href="#">import a file</a></p>'+
        '</div>'
      );
      
      enabled = true;
      methods.resizeTable();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CREATE NEW ROW
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    addRow: function() {
      
      enabled = false;
      if (total==undefined) {
        total = 0;
      } 
      var end = total <= ((actualPage+1)*defaults.resultsPerPage);
       
      if (end || $('div.empty_table').length>0) {
        if ($('div.empty_table').length>0) {
          $('div.empty_table').remove();
          addSingleRow(0);
        } else {
          addSingleRow(1);
        }
      } else {
        $('div.lastpage_window').show();
        $('div.mamufas').fadeIn();
        
        maxPage = Math.ceil(total / defaults.resultsPerPage) - 1;
        minPage = maxPage-1;
        actualPage = maxPage;
  
        $.ajax({
          method: "GET",
          url: defaults.getDataUrl,
          data: {
            rows_per_page: defaults.resultsPerPage,
            page: minPage+'..'+maxPage,
            query: defaults.query
          },
          success: function(data) {
            $(table).children('tbody').remove();
            methods.drawRows(defaults,data.rows,'next',actualPage);
            addSingleRow(2);
          }
        });
      }
      
      
      function addSingleRow(type) {
        var requestId = createUniqueId();
        requests_queue.newRequest(requestId,'add_row');
                
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
                  var options_list = '<span><h5>EDIT</h5><ul><li><a href="#">Duplicate row</a></li><li><a href="#delete_row" class="delete_row">Delete row</a></li></ul>' +
                                      '<div class="line"></div><h5>CREATE</h5><ul><li class="last"><a href="#add_row" class="add_row">Add new row</a></li>' +
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
              
                  if (type==2) {
                    $('div.table_position').addClass('end');
                  }
                  
                  
                  
                  //Si hay más filas de las permitidas por el reuso, borramos las '50' primeras, sumamos una a la página max, min y actual
                  total = total + 1;
                  if ($(table).children('tbody').children('tr').size()>defaults.reuseResults) {
                    maxPage++; minPage++; actualPage++;
                    $(table).children('tbody').children('tr:lt('+defaults.resultsPerPage+')').remove();
                  } else {
                    if ($(table).children('tbody').children('tr').size()>defaults.resultsPerPage) {
                      maxPage++; actualPage++;
                    }
                  }
                  
                  $(window).scrollTo('100%',500, {onAfter: function(){methods.closeTablePopups(); enabled = true;}});
                  $('div.empty_table').remove();
                  methods.resizeTable();
                },
                error: function(e) {
                  requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
                  enabled = true;
                }
             });
           }
        });
      }
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
        stopPropagation(ev);
        
        //For moving thead when scrolling
        if ($(document).scrollTop()>58) {
          $('section.subheader').css('top','-3px');
          $(table).children('thead').css('top','99px');
          if (($(document).scrollTop() + $(window).height())==$(document).height() || ($(document).scrollTop() + $(window).height())>$(document).height()) {
            $('div.general_options').addClass('end');
          } else {
            $('div.general_options').removeClass('end');
          }
        } else {
          $('div.general_options').removeClass('end');
          $('section.subheader').css('top',58-$(document).scrollTop()+'px');
          $(table).children('thead').css('top',160-$(document).scrollTop()+'px');
        }
        
        
        if ($('div.delete_column').is(':visible')) {
          $('div.delete_column').fadeOut();
        }


        //For paginating data
        var end = total <= ((actualPage+1)*defaults.resultsPerPage);
        
        if (!loading && enabled) {
          var difference = $(document).height() - $(window).height();
          if ($(window).scrollTop()==difference && !end) {
            loading = true;
            methods.showLoader('next');
            setTimeout(function(){methods.getData(defaults,'next')},500);
          } else if ($(window).scrollTop()==0 && minPage!=0) {
            loading = true;
            $('div.table_position').removeClass('end');
            methods.showLoader('previous');
            setTimeout(function(){methods.getData(defaults,'previous')},500);
          } else if (end && actualPage!=0) {
            $('div.table_position').addClass('end');
          }
        }
      });

      $('div.table_position').scroll(function(ev){
        if (($(document).scrollTop() + $(window).height())==$(document).height() || ($(document).scrollTop() + $(window).height())>$(document).height()) {
          $('div.general_options').addClass('end');
        } else {
          $('div.general_options').removeClass('end');
        }
        
        if ($('div.delete_row').is(':visible')) {
          $('div.delete_row').fadeOut();
        }
        
        //For moving table paginator loaders
        $('div.table_position div.loading_next').css('margin-left',$('div.table_position').scrollLeft()+'px');
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
      $(document).scroll();
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
        methods.refreshTable('next');
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

            methods.closeTablePopups();
            methods.bindESCkey();
            
            $('div.edit_cell p.error').hide();
            $('div.edit_cell input').removeClass('error');
            $('div.edit_cell textarea').removeClass('error');
            
            var target_position = $(target).parent().offset();
            var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
            $('tbody tr[r="'+data.row+'"]').addClass('editing');

            //Check if first row or last row
            if ($(target).parent().offset().top<260) {
              $('div.edit_cell').css('top','90px');
            } else if ($(target).parent().offset().top>$(document).height()-60) {
              $('div.edit_cell').css('top',target_position.top-230+'px');
            } else {
              $('div.edit_cell').css('top',target_position.top-192+'px');
            }
            
            //Check if first column or last column
            if ($("div.table_position").width()<=($(target).parent().offset().left+cell_size+28)) {
              $('div.edit_cell').css('left',$('div.table_position').scrollLeft()+target_position.left-215+($(target).width()/2)+'px');
            } else if (($(target).parent().offset().left+cell_size+28)<170) {
               $('div.edit_cell').css('left','0px');
            } else {
              $('div.edit_cell').css('left',$('div.table_position').scrollLeft()+target_position.left-128+($(target).width()/2)+'px');
            }


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
              if (type=="number"){
                $('div.edit_cell textarea').css({'min-height' : '16px','height' : '16px' });
              }else{
                $('div.edit_cell textarea').css({'min-height' : '30px','height' : '30px'});
              }
              $('div.edit_cell div.free').show();
              $('div.edit_cell div.free textarea').text(data.value);
            }
            
            $('div.edit_cell a.save').attr('r',data.row);
            $('div.edit_cell a.save').attr('c',data.column);
            $('div.edit_cell a.save').attr('type',type);
            $('div.edit_cell').show();
            
            if (type!='date' && type!='boolean') {
              $('div.edit_cell div.free textarea').focus();
              var len = $('div.edit_cell div.free textarea').text().length;
              $('div.edit_cell div.free textarea').selectRange(0,len);
            }
            
            
            $('body').bind('click',function(ev){
              if (!$(ev.target).closest('div.edit_cell').length) {
                methods.closeTablePopups();
                $('tbody tr').removeClass('editing');
              };
            });

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
            methods.closeTablePopups();
            
            // $('tbody tr').removeClass('selecting_first');
            // $('tbody tr').removeClass('selecting');
            // $('tbody tr').removeClass('selecting_last');
            // $(target).parent().parent().removeClass('selecting_first').removeClass('border').addClass('selected');

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
              methods.closeTablePopups();
              // $('tbody tr').removeClass('editing');
              // $('tbody tr').removeClass('selecting_first');
              // $('tbody tr').removeClass('selecting');
              // $('tbody tr').removeClass('selecting_last');
              //$('tbody tr').removeClass('selected');
              
              if (!$(target).parent().parent().parent().hasClass('selected')) {
                $(target).parent().parent().parent().addClass('editing');
              }
              $('body').click(function(event) {
                if (!$(event.target).closest('tbody tr td div span').length) {
                  methods.closeTablePopups();
                };
              });
            }

            if (!$(target).hasClass('selected')) {
              methods.closeTablePopups();
              methods.bindESCkey();
              
              $(target).parent().children('span').show();
              $(target).addClass('selected');

              $('body').click(function(event) {
                if (!$(event.target).closest('tbody tr td div span').length) {
                  methods.closeTablePopups();
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
      // $(document).mousedown(function(event){
      //   if (enabled) {
      //     var target = event.target || event.srcElement;
      //     var targetElement = target.nodeName.toLowerCase();
      // 
      //     if (targetElement == "div" && $(target).parent().is('td') && !event.ctrlKey && !event.metaKey) {
      //       $('table tbody tr td.first div span').hide();
      //       $('table tbody tr td.first div a.options').removeClass('selected');
      //       $('tbody tr').removeClass('editing');
      //       $('tbody tr').removeClass('selecting_first').removeClass('border');
      //       $('tbody tr').removeClass('selecting');
      //       $('tbody tr').removeClass('selecting_last');
      //       $('tbody tr').removeClass('selected');
      //       var first_row = $(target).parent().parent();
      //       first_row.addClass('selecting_first');
      //       var initial_x = first_row.position().top;
      // 
      //       if (event.preventDefault) {
      //         event.preventDefault();
      //         event.stopPropagation();
      //       } else {
      //         event.stopPropagation();
      //         event.returnValue = false;
      //       }
      //     }
      // 
      //     $(document).mousemove(function(event){
      //       var target = event.target || event.srcElement;
      //       var targetElement = target.nodeName.toLowerCase();
      // 
      //       if (targetElement == "div" && $(target).parent().is('td')) {
      //         var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
      //         var current_row = $(target).parent().parent();
      //         var current_x = current_row.position().top;
      //         $(table).children('tbody').children('tr').removeClass('selecting');
      //         current_row.addClass('selecting');
      //         var find = false;
      //         var cursor = first_row;
      // 
      //         while (!find) {
      //           if (initial_x<current_x) {
      //             first_row.removeClass('selecting_last').addClass('selecting_first');
      //             if (cursor.attr('r')==current_row.attr('r')) {
      //               cursor.addClass('selecting');
      //               cursor.next().removeClass('selecting');
      //               find=true;
      //             } else {
      //               cursor.next().removeClass('selecting');
      //               cursor.addClass('selecting');
      //               cursor = cursor.next();
      //             }
      //           } else if (initial_x>current_x) {
      //             first_row.removeClass('selecting_first').addClass('selecting_last');
      //             if (cursor.attr('r')==current_row.attr('r')) {
      //               cursor.addClass('selecting');
      //               cursor.prev().removeClass('selecting');
      //               find=true;
      //             } else {
      //               cursor.prev().removeClass('selecting');
      //               cursor.addClass('selecting');
      //               cursor = cursor.prev();
      //             }
      //           } else {
      //             find=true;
      //             return false;
      //           }
      //         }
      // 
      //       } else {
      //       }
      //       if (event.preventDefault) {
      //         event.preventDefault();
      //         event.stopPropagation();
      //       } else {
      //         event.stopPropagation();
      //         event.returnValue = false;
      //       }
      //     });
      //   }
      // });
      // $(document).mouseup(function(event){
      //   if (enabled) {
      //     var target = event.target || event.srcElement;
      //     var targetElement = target.nodeName.toLowerCase();
      // 
      //     if (targetElement == "div" && $(target).parent().is('td')) {
      //       var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
      //       if ($('tbody tr').hasClass('selecting_last')) {
      //         $('tbody tr[r="'+data.row+'"]').addClass('selecting_first');
      //         $('tbody tr[r="'+data.row+'"]').addClass('border');
      //         $('tbody tr.selecting_last').addClass('border');
      //       } else {
      //         $('tbody tr[r="'+data.row+'"]').addClass('selecting_last').addClass('border');
      //         $('tbody tr.selecting_first').addClass('border');
      //       }
      // 
      //       if ($('tbody tr[r="'+data.row+'"]').hasClass('selecting_last') && $('tbody tr[r="'+data.row+'"]').hasClass('selecting_first')) {
      //         $('tbody tr[r="'+data.row+'"]').removeClass('selecting_first');
      //         $('tbody tr[r="'+data.row+'"]').removeClass('selecting_last');
      //         $('tbody tr[r="'+data.row+'"]').removeClass('border');
      //         $('tbody tr[r="'+data.row+'"]').removeClass('selecting');
      //         $('tbody tr[r="'+data.row+'"]').removeClass('editing');
      //         $('tbody tr[r="'+data.row+'"]').removeClass('selected');
      //       }
      //       if (event.preventDefault) {
      //         event.preventDefault();
      //         event.stopPropagation();
      //       } else {
      //         event.stopPropagation();
      //         event.returnValue = false;
      //       }
      //     }
      //     $(document).unbind('mousemove');
      //   }
      // });



      ///////////////////////////////////////
      //  Editing table values             //
      ///////////////////////////////////////
      $("div.edit_cell a.save").livequery('click',function(ev){
        stopPropagation(ev);
        
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
          } else {
            methods.closeTablePopups();
            return false;
          }
        } else if (type=="date") {
          if ($("div.edit_cell div.date div.hour input").hasClass('error')) {
            $("div.edit_cell p.error").html('<span>Write a correct time</span>').fadeIn().delay(2000).fadeOut();
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
        } else if (type=="number") {
          if ($('tbody tr td[r="'+row+'"][c="'+column+'"] div').text()!=$("div.edit_cell textarea").val()) {
            var pattern = /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/;
            var value_ = $("div.edit_cell textarea").val();
            if (pattern.test(value_)) {
              $('div.edit_cell textarea').removeClass('error');
              var new_value = $("div.edit_cell textarea").val();
              var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
              $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text(new_value);
            } else {
              $('div.edit_cell textarea').addClass('error');
              $("div.edit_cell p.error").html('<span>Write a correct number</span>').fadeIn().delay(2000).fadeOut();
              return false;
            }
          } else {
            methods.closeTablePopups();
            return false;
          }
        } else {
          if ($('tbody tr td[r="'+row+'"][c="'+column+'"] div').text()!=$("div.edit_cell textarea").val()) {
            var new_value = $("div.edit_cell textarea").val();
            var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
            $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text(new_value);
          } else {
            methods.closeTablePopups();
            return false;
          }
        }
        
        params[column] = new_value;
        methods.updateTable("/rows/"+row,params,new_value,old_value,'update_cell',"PUT");
        
        $("div.edit_cell").hide();
        $("div.edit_cell textarea").css('width','262px');
        $("div.edit_cell textarea").css('height','30px');
        $('tbody tr[r="'+row+'"]').removeClass('editing');
      });
      $("div.edit_cell a.cancel,div.edit_cell a.close").livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        
        var row = $('div.edit_cell a.save').attr('r');
        $("div.edit_cell textarea").css('width','262px');
        $("div.edit_cell textarea").css('height','30px');
      });
      $("div.edit_cell div.boolean ul li a").livequery('click',function(ev){
        stopPropagation(ev);
        
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
        stopPropagation(ev);
        
        var input_value = $(this).parent().find('input').val();
        if (input_value < 31) {
          $('div.edit_cell div.date div.day input').val(parseInt(input_value)+1);
        }
      });
      $("div.edit_cell div.date div.day a.down").livequery('click',function(ev){
        stopPropagation(ev);
        
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
        stopPropagation(ev);
        
        var input_value = $(this).parent().find('input').val();
        if (input_value < 9999) {
          $('div.edit_cell div.date div.year input').val(parseInt(input_value)+1);
        }
      });
      $("div.edit_cell div.date div.year a.down").livequery('click',function(ev){
        stopPropagation(ev);
        
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
        stopPropagation(ev);
        
        $('div.months_list').css('display','block');
        var custom_scrolls = [];
        $('.scrollPane').each(function(){
          custom_scrolls.push($(this).jScrollPane().data().jsp);
        });
        $.each(custom_scrolls,function(i) {
          this.destroy();
        });
        $("ul.scroll-pane").jScrollPane();
        
        $('body').click(function(event) {
          if (!$(event.target).closest('div.months_list').length) {
            $('div.months_list').hide();
            $('body').unbind('click');
          };
        });
      });
      $("div.months_list ul li a").livequery('click',function(ev){
        stopPropagation(ev);
        
        $(this).closest('div.month').children('span.bounds').children('a').text($(this).text())
        $(this).closest('div.months_list').hide();
      });     
      
      
      ///////////////////////////////////////
      //  Header options events            //
      ///////////////////////////////////////
      //Head options even
      $('thead tr a.options').livequery('click',function(ev){
        stopPropagation(ev);

        if (!$(this).hasClass('selected')) {
          methods.closeTablePopups();
          methods.bindESCkey();
          $(this).addClass('selected');
          var col_type = $(this).closest('th').find('a.column_type').text().toLowerCase();
          if (col_type!="string" && col_type!="number") {
            $('span.col_ops_list h5:contains("GEOREFERENCE")').hide();
            $('span.col_ops_list div.geo_line').hide();
            $('span.col_ops_list ul.geo_list').hide();
          } else {
            $('span.col_ops_list h5:contains("GEOREFERENCE")').show();
            $('span.col_ops_list div.geo_line').show();
            $('span.col_ops_list ul.geo_list').show();
          }
          $(this).parent().children('span.col_ops_list').show();

          $('body').click(function(event) {
            if (!$(event.target).closest('thead tr span').length) {
              methods.closeTablePopups();
            };
          });
        } else {
          methods.closeTablePopups();
        }
      });
      $('thead tr a.column_type').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();
        
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
           methods.closeTablePopups();
         };
        });
      });
      $('span.col_types ul li a').livequery('click',function(ev){
        stopPropagation(ev);
        
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
        methods.closeTablePopups();
      });
      $('thead tr th div h3,thead tr th div input,thead tr span.col_types,thead tr span.col_ops_list').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
      });
      $('thead tr th div h3').livequery('dblclick',function(){
        methods.closeTablePopups();
        
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
            stopPropagation(ev);
            updateColumnName();
          }
        });
        input.focusout(function(){
          updateColumnName();
        });


      });
      $('thead a.rename_column').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $(this).closest('div').find('h3').trigger('dblclick');
      });
      $('thead a.change_data_type').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        $(this).closest('div').find('a.column_type').trigger('click');
      });
      $('thead a.delete_column').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();
        
        $(this).closest('div').find('a.options').removeClass('selected');
        $(this).closest('div').find('span.col_ops_list').hide();
        var column = $(this).closest('th').attr('c');
        var left_position = $(table).find('th[c="'+column+'"]').position().left;
        var options_position = $(table).find('th[c="'+column+'"]').find('a.options').position().left;

        $('div.delete_column a.button').attr('c',column);
        if ($(document).scrollTop()>58) {
          $('div.delete_column').css('top',$(document).scrollTop()-50+'px');
        } else {
          $('div.delete_column').css('top','15px');
        }
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
        stopPropagation(ev);
        methods.closeTablePopups();
      });
      $('div.delete_column a.button').livequery('click',function(ev){
        stopPropagation(ev);
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
        stopPropagation(ev);
        methods.closeTablePopups();
        $(this).find('a.options').trigger('click');
      });
      
      
      ///////////////////////////////////////
      //  Georeference window events       //
      ///////////////////////////////////////
      $('a.open_georeference,p.geo').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();
        enabled = false;
        var me = this;
        
        if (geolocating) {
          $('div.mamufas div.stopgeo_window').show();
          $('div.mamufas').fadeIn();
          return false;
        }
        
        resetProperties();
        getColumns();
        
        
        
        function resetProperties() {
          $('div.georeference_window div.inner_ span.top').css('opacity',1).show();
          $('div.georeference_window div.inner_ span.bottom').css('opacity',1).show();
          $('div.georeference_window a.close_geo').show();
          $('div.georeference_window').css('height','auto');
          $('div.georeference_window div.inner_').css('height','auto');
          $('div.georeference_window').removeClass('loading');
          $('div.georeference_window span.select').addClass('disabled');
          $('div.georeference_window span.select a.option').each(function(i,ele){
            $(ele).text('Retrieving columns...').attr('c','');
          });
          $('div.georeference_window a.confirm_georeference').addClass('disabled');
          $('div.georeference_window span.select').removeClass('clicked');
          
          //Reset second item of the main_list (compont geo)
          $('div.second_column_address').hide();
          $('div.third_column_address').hide();
          $('div.first_column_address a.remove_column').hide();
          $('div.first_column_address a.combine').hide();
          $('div.first_column_address').show();

          
          // Remove selected li class before know where geo column is.
          $('div.georeference_window ul.main_list li').removeClass('selected');
          
          // Remove all ScrollPane and lists items //
          var custom_scrolls = [];
          $('.scrollPane').each(function(){
       		  custom_scrolls.push($(this).jScrollPane().data().jsp);
       		});
     		  $.each(custom_scrolls,function(i) {
            this.destroy();
          });
          $('div.georeference_window span.select ul li').remove();
        }
        
        
        
        function getColumns() {
          $.ajax({
             method: "GET",
             url: '/api/json/tables/'+table_id+'/schema',
             success: function(data) {
               
               // Select item depending on the kind of referenciation before
               var geo_col_type = '';
               if ($('p.geo').length==0) {
                 $('div.georeference_window ul.main_list li.first_list:eq(0)').addClass('selected');
                 geo_col_type = '';
               } else if ($('p.geo').hasClass('latitude')) {
                 $('div.georeference_window ul.main_list li.first_list:eq(0)').addClass('selected');
                 geo_col_type = 'latlng';
               } else {
                 $('div.georeference_window ul.main_list li.first_list:eq(1)').addClass('selected');
                 geo_col_type = 'address';
               }

               for (var i = 0; i<data.length; i++) {
                 if (data[i][0]!="cartodb_id" && data[i][0]!="created_at" && data[i][0]!="updated_at" && (data[i][1]=="number" || data[i][1]=="string")) {
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
               
               $('div.georeference_window span.select:eq(1) ul').append('<li><a href="#no_geo">Empty</a></li>');
               $('div.georeference_window span.select:eq(0) ul').append('<li><a href="#no_geo">Empty</a></li>');
               $('div.georeference_window span.select').removeClass('disabled');

               $('div.georeference_window span.select a.option').each(function(i,ele){
                 if ($(ele).text()=="Retrieving columns...") {
                    $(ele).text('Select a column').attr('c','');
                  }
               });
               $('div.georeference_window a.confirm_georeference').removeClass('disabled');
               $(me).closest('div').find('a.options').removeClass('selected');
               $(me).closest('div').find('span.col_ops_list').hide();
               $('div.mamufas div.georeference_window').show();
               $('div.mamufas').fadeIn();
             },
             error: function(e) {
               $('div.georeference_window span.select:eq(0) a:eq(0)').text('Error retrieving cols').attr('c','');
               $('div.georeference_window span.select:eq(1) a:eq(0)').text('Error retrieving cols').attr('c','');
             }
          });
        }
      });
      $('div.georeference_window span.select a.option').livequery('click',function(ev){
        stopPropagation(ev);
        if (!$(this).parent().hasClass('disabled')) {
          if ($(this).parent().hasClass('clicked')) {
            $(this).parent().removeClass('clicked');
          } else {
            $('span.select').removeClass('clicked');
            $('body').bind('click',function(ev){
              if (!$(ev.target).closest('span.select').length) {
                $('span.select').removeClass('clicked');
              };
            });
            $(this).parent().addClass('clicked');
            $(this).parent().find('ul').jScrollPane();
          }
        }
      });
      $('div.georeference_window span.latitude ul li a,div.georeference_window span.longitude ul li a').livequery('click',function(ev){
        stopPropagation(ev);
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
      $('div.georeference_window span.address ul li a').livequery('click',function(ev){
        stopPropagation(ev);
        $(this).closest('span.select').children('a.option').text($(this).text());
        $(this).closest('span.select').children('a.option').attr('c',$(this).text());
        $('span.select').removeClass('clicked');
        
        var block_class = $(this).closest('div.block');
        if (block_class.hasClass('first_column_address')) {
          if (!$('div.second_column_address').is(':visible')) {
            $('div.georeference_window div.second_column_address').show();
            $('div.georeference_window div.second_column_address a.remove_column').show();
          }
        } else if (block_class.hasClass('second_column_address')) {
          if (!$('div.third_column_address').is(':visible')) {
            $('div.georeference_window div.second_column_address a.remove_column').hide();
            $('div.georeference_window div.third_column_address').show();
            $('div.georeference_window div.third_column_address a.remove_column').show();
          }
        } else {
          $('div.georeference_window div.third_column_address a.remove_column').show();
        }
      });
      $('div.georeference_window a.remove_column').livequery('click',function(ev){
        stopPropagation(ev);
        $(this).closest('div.block').children('span.select').children('a.option').text('Select a column');
        $(this).closest('div.block').children('span.select').children('a.option').attr('c','');
        $('span.select').removeClass('clicked');
        
        var block_class = $(this).closest('div.block');
        if (block_class.hasClass('first_column_address')) {
          $('div.georeference_window div.first_column_address a.remove_column').hide();
        } else if (block_class.hasClass('second_column_address')) {
          $('div.georeference_window div.first_column_address a.remove_column').show();
          $('div.georeference_window div.second_column_address').hide();
          $('div.georeference_window div.second_column_address a.remove_column').hide();
        } else {
          $('div.georeference_window div.second_column_address a.remove_column').show();
          $('div.georeference_window div.third_column_address').hide();
          $('div.georeference_window div.third_column_address a.remove_column').show();
        }
      });
      $('div.georeference_window div.inner_ span.top ul li a.first_ul').livequery('click',function(ev){
        stopPropagation(ev);
        if (!$(this).parent().hasClass("disabled")) {
          $('div.georeference_window div.inner_ span.top ul:eq(0) li').removeClass('selected');
          $(this).parent().addClass('selected');
        }
      });
      $('a.confirm_georeference').livequery('click',function(ev){
        stopPropagation(ev);
        
        if (!$(this).hasClass('disabled')) {
          if ($('div.georeference_window ul.main_list li.first_list:eq(1)').hasClass('selected')) {
            var params = {};
            var address = '';
            
            $('div.georeference_window ul.main_list li.first_list:eq(1) a.option').each(function(index,element){
              if ($(element).attr('c')!='') {
                address += $(element).attr('c') + ',';
              }
            });
            address = address.substr(0,address.length-1);
            if (address!='') {
              loadingState();
              params['address_column'] = address;
              setTimeout(function(){methods.updateTable("/set_geometry_columns",params,null,null,'update_geometry',"PUT");},1000);
            } else {
              $('div.georeference_window p.error').text('You have to select at least one column');
              $('div.georeference_window p.error').css('opacity',0);
              $('div.georeference_window p.error').css('display','block');
              $('div.georeference_window p.error').fadeTo(300,1);
              $('div.georeference_window p.error').delay(3000).fadeTo(300,0,function(){
                $('div.georeference_window p.error').css('display','none');
              });
            }
          } else {
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
          }
        }
        
        
        function loadingState() {
          methods.unbindESCkey();
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
      $('div.georeference_window a.close_geo,div.georeference_window a.cancel').livequery('click',function(ev){
        stopPropagation(ev);
        enabled = true;
        methods.closeTablePopups();
      });
      $('a.cancel_geo').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        $(window).trigger('stopGeo');
        enabled = true;
      });
      $('a.close').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
      });
      
      
      ///////////////////////////////////////
      //  Add row events                   //
      ///////////////////////////////////////
      $('a.add_row').livequery('click',function(ev){
        stopPropagation(ev);
        if (enabled){
          methods.addRow();
        }
      });
      $('a.delete_row').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();
        
        var cartodb_id = $(this).closest('tr').attr('r');
        
        var top_position = $(table).find('tr[r="'+cartodb_id+'"]').position().top;

        $('div.delete_row a.button').attr('r',cartodb_id);
        $('div.delete_row').css('top',top_position-7+'px');
        $('div.delete_row').css('left',$('div.table_position').scrollLeft()+10+'px');
        $('div.delete_row').show();

        $('body').click(function(event) {
         if (!$(event.target).closest('div.delete_row').length) {
           methods.closeTablePopups();
           $('body').unbind('click');
         };
        });
        
      });
      $('div.delete_row a.button').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        
        var row = $(this).attr('r');
        var params = {};
        params.row = row;
        
        methods.updateTable('/rows/'+row,params,null,null,"delete_row","DELETE");
      });
      
      
      ///////////////////////////////////////
      //  Add column events                //
      ///////////////////////////////////////
      $('a.add_column').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();
        enabled = false;
        
        $('div.column_window p.error').hide();
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
           },
           error: function(e) {
              $('div.column_window span.select a.option').text('Error retrieving types').attr('type','');
           }
        });

        $('div.mamufas div.column_window').show();
        $('div.mamufas').fadeIn();
      });
      $('div.column_window span.select a.option').livequery('click',function(ev){
        stopPropagation(ev);
        if (!$(this).parent().hasClass('disabled')) {
          if ($(this).parent().hasClass('clicked')) {
            $(this).parent().removeClass('clicked');
          } else {
            $('body').bind('click',function(ev){
              if (!$(ev.target).closest('div.column_window span.select').length) {
                $('div.column_window span.select').removeClass('clicked');
              };
            });
            $(this).parent().addClass('clicked');
          }
        }
      });
      $('div.column_window span.select ul li a').livequery('click',function(ev){
        stopPropagation(ev);
        $(this).closest('span.select').children('a.option').text($(this).text());
        $(this).closest('span.select').children('a.option').attr('type',$(this).text());
        $('div.column_window span.select').removeClass('clicked');
      });
      $('a.column_add').livequery('click',function(ev){
        stopPropagation(ev);
        $('div.column_window span.select').removeClass('clicked');
        
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
          $('div.column_window p.error').fadeIn().delay(2000).fadeOut();
          
        }
      });
      $('div.column_window a.close_create,div.column_window a.cancel').livequery('click',function(ev){
        stopPropagation(ev);
        enabled = true;
        methods.closeTablePopups();
      });
      
      
      ///////////////////////////////////////
      //  SQL Editor                       //
      ///////////////////////////////////////
      // //SQL Editor
      $('div.general_options div.sql_console span a.close').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        
        $('div.general_options div.sql_console').hide();
        $('div.general_options ul').removeClass('sql');
      });
      // General options
      $('div.general_options ul li a.sql').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        
        $('div.general_options div.sql_console').show();
        $('div.general_options ul').addClass('sql');
      });


      ///////////////////////////////////////
      //  Move table -> left/right         //
      ///////////////////////////////////////
      $('span.paginate a.next').click(function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        
        var scrollable = $('div.table_position').scrollLeft();
        console.log(scrollable);
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
        stopPropagation(ev);
        methods.closeTablePopups();
        
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
      console.log('jamon');
      
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
                                if (params.address_column != undefined && params.address_column != '') {
                                  var address_cols = params.address_column.split(',');
                                  if (address_cols.length==1) {
                                    $('thead tr th[c='+address_cols[0]+'] h3').parent().append('<p class="geo address loading">geo</p>');
                                  } else {
                                    methods.refreshTable('');
                                  }
                                  var geo_address = new Geocoding(params.address_column,table_id);
                                } else {
                                  $('thead tr th h3:contains('+params.lat_column+')').parent().append('<p class="geo latitude">geo</p>');
                                  $('thead tr th h3:contains('+params.lon_column+')').parent().append('<p class="geo longitude">geo</p>');
                                }
                                methods.closeTablePopups();
                                break;
        case "new_column":      methods.closeTablePopups();
                                headers[params.column.name] = params.column.type;
                                methods.refreshTable('next');
                                break;
        case "delete_column":   delete headers[params.column.name];
                                methods.refreshTable('');
                                break;                                
        case "delete_row":      methods.refreshTable('');
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
        case "update_geometry": methods.closeTablePopups();
                              break;
        
        case "column_type":   var element = $('th[c="'+params.column.name+'"]').find('p.long').children('a');
                              element.text(old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#b4b4b4'},300);},1000);
                              });
                              break;
        case "new_column":    methods.closeTablePopups();
        default:              break;
      }
    },
  
  
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  REFRESH TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refreshTable: function(position) {
      loading = true;
      if (position!='') {
        minPage = 0;
        maxPage = -1;
      } else {
        previous_scroll = $(document).scrollTop();
      }
      $(table).children('thead').remove();
      $(table).children('tbody').remove();
      $(document).scrollTop(0);
      $('div.table_position').removeClass('end');
      methods.getData(defaults, position);
      enabled = true;
    },
    
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CLOSE ALL POPUPS WINDOWS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    closeTablePopups: function() {
      methods.unbindESCkey();
      $('body').unbind('click');
      enabled = true;
      
      //Column row popup
      $('div.delete_row').hide();
      //Column delete popup
      $('div.delete_column').hide();
      //Edit window
      $('div.edit_cell').hide();
      //Remove row editing class
      $('tbody tr').removeClass('editing');
      //Row options
      $('table tbody tr td.first div a.options').removeClass('selected');
      $('table tbody tr td.first div span').hide();
      //Thead options
      $('thead tr span.col_types').hide();
      $('thead tr a.options').removeClass('selected');
      $('thead tr span.col_ops_list').hide();
      
      //popup windows
      $('div.mamufas').fadeOut('fast',function(){
        $('div.mamufas div.georeference_window').hide();
        $('div.mamufas div.column_window').hide();
        $('div.mamufas div.lastpage_window').hide();
        $('div.mamufas div.stopgeo_window').hide();
      });
      
      closeOutTableWindows();
    },
    
    
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  BIND ESC KEY PRESS EVENT
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    bindESCkey: function() {
      $(document).keydown(function(event){
        if (event.which == '27') {
          methods.closeTablePopups();
        }
      });
    },
    
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  UNBIND ESC KEY PRESS EVENT
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    unbindESCkey: function() {
      $(document).unbind('keydown');
      $('body').unbind('click');
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