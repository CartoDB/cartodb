;(function($){
  
  var defaults;
  var table = {
    // DOM element
    e: null,
    // Table headers
    h:[],
    // Pages stuff
    min_p: 0,
    max_p: -1,
    actual_p:0,
    total_r:0,
    // Flags
    loading: false,
    edited: false,
    enabled: true,
    loaded: false,
    // Cell sizes stuff
    cell_s: 100,
    last_cell_s: 100,
    // Scroll stuff
    scroll:0,
    // Table mode (normal, query or filter)
    mode: 'normal'
  }


  // TODOS
  // Remove georeferencing when the table is not point geom_type
  // New loader with georeferencing and previous errors... plof
  
  // Review bugs again and again
  
  // QUESTIONS
  // If you have filtered something - add new row? - go to normal mode and add new row...
  
  
  var methods = {


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  INIT PLUGIN
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    init : function() {
      return this.each(function(){
        table.e = $(this);
        if (defaults.enabled) {
          methods.getData(defaults, 'next');
        }
        methods.keepSize();
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  GET DATA
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getData : function(options, direction, new_query, refresh) {
      
      // Show loader
      if (!table.loaded || refresh) {
        var requestId = createUniqueId();
        requests_queue.newRequest(requestId,table.mode+'_table');
      } 


      
			//Pagination AJAX adding rows
			var request_pages;
			if (direction=="next") {
			  table.max_p++;
			  table.actual_p = table.max_p;
			  request_pages = table.actual_p;
			} else if (direction=="previous") {
			  table.min_p--;
			  table.actual_p = table.min_p;
			  request_pages = table.actual_p;
			} else {
			  table.enabled = false;
			  request_pages = table.min_p +'..'+ table.max_p;
			}

      
      // New table mode: normal, query or filter
			var columns,
			    rows,
			    count = 0;

      // When ajax calls are loaded 
  		$(document).bind('arrived',function(){
			  count++;
			  if (count==2) {
			    if (table.mode!='query') {
  			    $(document).unbind('arrived');
  			    startTable();
			    } else {
  				  $(document).unbind('arrived');
  				  methods.drawQueryColumns(rows,table.total_r,time,new_query);
  			    methods.drawQueryRows(rows,direction,table.actual_p);
			    }
			    
			    // Remove loader
			    requests_queue.responseRequest(requestId,'ok','');
			  }
			});
      
 
			if (table.mode!='query') {
        // FILTER OR NORMAL MODE
        // Request schema
			  $.ajax({
			    method: "GET",
			    url: options.getDataUrl + table_name,
			 		headers: {"cartodbclient":"true"},
			    success: function(data) {
				 		columns = data.schema;
			      $(document).trigger('arrived');
			    },
			    error: function(e) {
			      requests_queue.responseRequest(requestId,'error','There has been an error, try again later...');
			      $(document).unbind('arrived');
			    }
			  });

        // Request rows
			  $.ajax({
			     method: "GET",
			     url: options.getDataUrl + table_name +'/records',
			     data: {
			       rows_per_page: options.resultsPerPage,
			       page: request_pages,
			       mode: defaults.mode,
			       order_by: defaults.order_by,
			       filter_column: (table.mode=="filter")?options.filter_column:'',
			       filter_value: (table.mode=="filter")?options.filter_value:'',
			     },
				 	headers: {"cartodbclient":"true"},
			    success: function(data) {
			      rows = data.rows;
			      table.total_r = data.total_rows;
			      $(document).trigger('arrived');
			    },
			    error: function(e) {
  			    requests_queue.responseRequest(requestId,'error','There has been an error, try again later...');
			      $(document).unbind('arrived');
			      table.total_r = 0;
			      startTable();
			    }
			  });

			} else {
			  
			  // QUERY MODE
				setAppStatus(); // Change app status depending on query mode

				var time;
				var query = editor.getValue();
				var is_write_query = query.search(/^\s*(CREATE|UPDATE|INSERT|ALTER).*/i)!=-1;
				
				// Get the total rows of the query
				if (new_query!=undefined && !is_write_query) {
					$.ajax({
				    method: "GET",
				    url: global_api_url+'queries?sql='+escape('SELECT count(*) FROM ('+query+') as count'),
				 		headers: {"cartodbclient":"true"},
				    success: function(data) {
							table.total_r = data.rows[0].count;
							$('div.sql_console span h3').html('<strong>'+table.total_r+' results</strong>');
							$(document).trigger('arrived');
				    },
				    error: function(e) {
				      requests_queue.responseRequest(requestId,'error','There has been an error, try again later...');
				      $(document).unbind('arrived');
				    }
				  });
				} else {
					$(document).trigger('arrived');
				}


			  $.ajax({
			    method: "POST",
			    url: global_api_url+'queries?sql='+escape(editor.getValue()),
			    data: {
			      rows_per_page: options.resultsPerPage,
			      page: request_pages
			    },
			 		headers: {"cartodbclient":"true"},
			    success: function(data) {
			      // Remove error content
						$('div.sql_window span.errors').hide();
						$('div.sql_window div.inner div.outer_textarea').css({bottom:'50px'});
						$('div.sql_window').css({'min-height':'199px'});
						
						time = data.time.toFixed(3);
			      rows = data.rows;
			      $(document).trigger('arrived');
			    },
			    error: function(e) {
            requests_queue.responseRequest(requestId,'error','Query error, see details in the sql window...');
			      $(document).unbind('arrived');
			      
			      var errors = $.parseJSON(e.responseText).errors;
			      $('div.sql_window span.errors p').text('');
			      _.each(errors,function(error,i){
			        $('div.sql_window span.errors p').append(' '+error+'.');
			      });
			      
			      var new_bottom = 65 + $('div.sql_window span.errors').height();
			      $('div.sql_window div.inner div.outer_textarea').css({bottom:new_bottom+'px'});
			      
			      var new_height = 199 + $('div.sql_window span.errors').height();
			      $('div.sql_window').css({'min-height':new_height+'px'});
			      $('div.sql_window span.errors').show();
			      
			      methods.drawQueryColumns([]);
			    }
			  });
			}



      function startTable() {
        if (table.total_r==0) {
          //Start new table
          //Calculate width of th on header
          var window_width = $(window).width();
          if (window_width>((columns.length*113)+42)) {
            table.cell_s = ((window_width-150)/(columns.length-1))-27;
            table.last_cell_s = table.cell_s;
          }
          table.max_p = -1;
          if (table.e.children('thead').length==0) 
            methods.drawColumns(columns);
          if (table.mode=="normal")
            methods.startTable();
        } else {
          if (rows.length>0) {
            $('div.empty_table').remove();
            if (table.e.children('thead').length==0) {
              //Calculate width of th on header
              var window_width = $(window).width();
              if (window_width>((columns.length*113)+42)) {
                table.cell_s = ((window_width-150)/(columns.length-1))-27;
                table.last_cell_s = table.cell_s;
              }
              methods.drawColumns(columns,rows,direction,table.actual_p,options);
            } else {
              methods.drawRows(options,rows,direction,table.actual_p);
            }
          } else {
            methods.hideLoader();
            if (direction=="next") {
              table.max_p--;
            } else {
              table.min_p++;
            }
          }
        }
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DRAW COLUMNS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    drawColumns: function(data,rows,direction,actualPage,options) {
      table.h = [];
      //Draw the columns headers
      var thead = '<thead style="'+((table.mode!="normal")?'height:91px':'')+'"><tr><th class="first"><div></div></th>';


      _.each(data,function(element,index){
        //Get type of table -> Points, polygons or lines
        if (element[3]!=undefined) {
          map_type = element[3];
        }
        if (element[1]!="length") {
	        // Save column headers
	        table.h.push({name:element[0],type:element[3] || element[1]});

	        // Playing with templates (table_templates.js - Mustache.js)
	        thead += Mustache.to_html(th,{
	          allowed:(element[0]!="cartodb_id" && element[0]!="created_at" && element[0]!="updated_at" && element[3]==undefined)?true:false,
	          type:element[1],
	          number: element[1]=="number",
	          name:element[0],
	          cartodb_id: (element[0]!="cartodb_id")?false:true,
	          cellsize: table.cell_s,
	          geo: (element[3]==undefined)?false:true
	        });
				}

      });


      thead += "</thead></tr>";
      table.e.append(thead);
      
      
      if (table.mode!="normal") {
        table.e.find('thead').append('<div class="stickies"><p><strong>'+table.total_r+' result'+((table.total_r>1)?'s':'')+'</strong> for your filter in column "'+defaults.filter_column+'"  with text "'+defaults.filter_value+
          '" - <a class="remove_filter" href="#disabled_filter">remove your filter</a></p></div>');
      } else {
        table.e.find('thead div.stickies').remove();
      }


      if (!table.loaded) {
        table.loaded = true;
        //Print correct column types
        methods.getColumnTypes();

        //Scroll event
        methods.addScroll();

        //Cell click event
        methods.bindEvents();

        //Create elements
        methods.createElements();
      }

      methods.drawRows(options,rows,direction,actualPage);
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DRAW COLUMNS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    drawQueryColumns: function(rows,total,time,new_query) {
      if (rows.length>0) {
				if (new_query) {
					//Draw the columns headers
		      var thead = '<thead style="height:91px"><tr><th class="first"><div></div></th>';
		      table.h = [];

					$('span.query h3').html(total + ' row' + ((total>1)?'s':'') + ' matching your query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
					$('span.query p').text('This query took '+time+' seconds');
					_.eachRow(rows[0],function(ele,i){
						switch (i) {
							case "the_geom": type = 'Geometry'; break;
							case "created_at": type = 'Date'; break;
							case "updated_at": type = 'Date'; break;
							case "cartodb_id": type = 'Number'; break;
							default: type = 'Unknown';
						}

	          thead += 	'<th>'+
	                     	'<div '+((i=="cartodb_id")?'style="width:75px"':' style="width:'+table.cell_s+'px"') + '>'+
	                      	'<span class="long">'+
	                     			'<h3 class="static">'+i+'</h3>'+
														((i=="the_geom")?'<p class="geo disabled">geo</p':'')+
	                      	'</span>'+
													'<p class="long">'+
	                     			'<a class="static">'+type+'</a>'+
	                      	'</p>'+
													'<a class="options disabled">options</a>'+
	                     	'</div>'+
	                   	'</th>';
					});

					thead += "</tr></thead>";
					table.e.append(thead);

					table.e.find('thead').append('<div class="stickies"><p><strong>'+total+' result'+((total>1)?'s':'')+'</strong> - Read-only. <a class="open_console" href="#open_console">Change your query</a> or <a class="clear_table" href="#disable_view">clear</a></p></div>');
				}
      } else {
				$('span.query h3').html('No results for this query <a class="clear_table" href="#clear">CLEAR VIEW</a>');
				$('span.query p').text('');
				var thead = '<thead><tr><th class="first"><div></div></th><th><div></div></th></tr></thead>';
				table.e.append(thead);
			}
      
			methods.resizeTable();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DRAW ROWS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    drawRows: function(options,data,direction,page) {
      
      if (table.e.children('tbody').length==0) {
        if (table.mode == "filter") {
          var tbody = '<tbody style="padding-top:89px;">';
        } else {
          var tbody = '<tbody style="padding-top:53px;">';
        }
      } else {
        var tbody = '';
      }

      //Loop all the data
      _.each(data, function(element,i){

        // Get first td
        tbody += Mustache.to_html(first_td,{
          cartodb_id: element['cartodb_id']
        });

        // Get rest generic td
				_.eachRow(table.h,function(head,x){
				  var data = element[head.name];
				  var j = head.name;
		      tbody += Mustache.to_html(generic_td,{
	          value: function(){
              if (data==null) {
                return '';
              } else if (j=="the_geom") {
                if (data!="GeoJSON") {
                  var json = $.parseJSON(data);
                  if (json.type=="Point") {
                    return json.coordinates[0] +', ' + json.coordinates[1];
                  } else {
  									return data;
  								}
                } else {
                  return data+'...';
                }
              } else {
                return data;
              }
	           },
	           cartodb_id: element['cartodb_id'],
	           is_cartodb_id:(j=="cartodb_id")?true:false,
	        	 allowed: (j=="cartodb_id" || j=="created_at" || j=="updated_at")?true:false,
	           cellsize: table.cell_s,
	           column: j,
	           geojson: (data!='GeoJSON')?true:false
	         });
        });

        var start = tbody.lastIndexOf('"width:');
        var end = tbody.lastIndexOf('px"');
        tbody = tbody.substring(0,start) + '"width:' + table.last_cell_s + tbody.substring(end);

        tbody += '</tr>';
      });


      // If the table is empty or not
      if (table.e.children('tbody').length==0) {
        tbody += '</tbody>';
        table.e.append(tbody);
        methods.resizeTable();
      } else {
        (direction=="previous")?table.e.children('tbody').prepend(tbody):table.e.children('tbody').append(tbody);
      }

      // If there was a previous action
      if (direction!='') {
        methods.checkReuse(direction);
      } else {
        $('body').animate({scrollTop:table.scroll},300,function() {
          table.loading = false; table.enabled = true;
        });
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DRAW QUERY ROWS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    drawQueryRows: function(rows,direction,page) {

      if (table.e.children('tbody').length==0) {
        var tbody = '<tbody style="padding-top:89px;">';
      } else {
        var tbody = '';
      }

      _.each(rows, function(element,i){
        tbody += '<tr><td class="first"><div></div></td>';
    		_.eachRow(element,function(ele,j){
    			tbody += 	'<td '+((j=="cartodb_id" || j=="created_at" || j=="updated_at")?'class="special"':'')+
									 	' r="'+ element['cartodb_id'] +'" c="'+ j +'"><div '+((j=='cartodb_id')?'':' style="width:'+table.cell_s+'px"') +
									 	'>'+((element[j]==null)?'':element[j])+'</div></td>';
    		});
        tbody += '</tr>';
      });

      if (table.e.children('tbody').length==0) {
        tbody += '</tbody>';
        table.e.append(tbody);
        methods.resizeTable();
      } else {
        (direction=="previous")?table.e.children('tbody').prepend(tbody):table.e.children('tbody').append(tbody);
      }

      if (direction!='') {
        methods.checkReuse(direction);
      } else {
        $('body').animate({scrollTop:table.scroll},300,function() {
          table.loading = false; table.enabled = true;
        });
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  GET COLUMN TYPES AND PRINT THEM
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    getColumnTypes: function() {
			var types = ["Number","String","Date","Boolean"];

      $('span.col_types').each(function(index,element){
        $(element).children('ul').children('li').remove();
        for (var i = 0; i<types.length; i++) {
          $(element).children('ul').append('<li><a href="#'+types[i]+'">'+types[i]+'</a></li>');
        }
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CHECK COLUMNS USED FOR REUSING
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    checkReuse: function(direction) {

      if ((((table.max_p - table.min_p)+1)*defaults.resultsPerPage>defaults.reuseResults)) {
        if (direction=="next") {
          table.min_p++;
          table.e.children('tbody').children('tr:lt('+defaults.resultsPerPage+')').remove();
        } else {
          table.max_p--;
          table.e.children('tbody').children('tr:gt('+(defaults.reuseResults-1)+')').remove();
        }
      }

      methods.hideLoader();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CREATE TABLE ELEMENTS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    createElements: function() {

      //Paginate loaders
      table.e.prepend(
      '<div class="loading_previous loading">' +
        '<span>'+
          '<img src="/images/admin/table/activity_indicator.gif" alt="Loading..." title="Loading" />'+
          '<p>Loading previous rows...</p>'+
          '<p class="count">Now vizzualizing 50 of X,XXX</p>'+
        '</span>'+
      '</div>');

      table.e.parent().append(
      '<div class="loading_next loading">' +
        '<span>'+
          '<img src="/images/admin/table/activity_indicator.gif" alt="Loading..." title="Loading" />'+
          '<p>Loading next rows...</p>'+
          '<p class="count">Now vizzualizing 50 of X,XXX</p>'+
        '</span>'+
      '</div>');


      //Edit caption
      table.e.parent().append(
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
            '<div class="point">'+
              '<span class="point_block lon">'+
                '<p>Lon</p>'+
                '<input type="text" value="0" id="longitude_value" />'+
              '</span>'+
              '<p>,</p>'+
              '<span class="point_block lat">'+
                '<p>Lat</p>'+
                '<input type="text" value="0" id="latitude_value" />'+
              '</span>'+
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
      table.e.parent().append(
        '<div class="delete_row">'+
          '<p>You are about to delete this row. Are you sure?</p>'+
          '<a class="cancel_delete" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#delete_row">Yes, delete it</a>'+
        '</div>');


      //Column delete tooltip
      table.e.parent().append(
        '<div class="delete_column">'+
          '<p>You are about to delete this column. Are you sure?</p>'+
          '<a class="cancel_delete" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#delete_column">Yes, delete it</a>'+
        '</div>');


      //Change column type tooltip
      table.e.parent().append(
        '<div class="change_type_column">'+
          '<p>Likely you will lose all this column data. Are you sure?</p>'+
          '<a class="cancel_change" href="#cancel_delete">cancel</a>'+
          '<a class="button" href="#change_type">Yes, do it</a>'+
        '</div>');

      
      // Explain tooltip
      table.e.parent().append(
        '<div class="explain_tooltip">'+
          '<p>Double-click for editing any cell</p>'+
          '<span class="arrow"></span>'+
        '</div>');
        
        
      // Filter table
      table.e.parent().append(
        '<div class="filter_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<form>'+
              '<span class="top">'+
                '<h3>Filter by a column</h3>'+
                '<p>This helps you to find something in your table</p>'+
                '<label>TEXT FILTER</label>'+
                '<input type="text" value=""/>'+
              '</span>'+
              '<span class="bottom">'+
                '<input type="submit" class="apply_query" value="Apply query"/>'+
                '<a href="#clear_filter" class="clear_filter">Clear filter</a>'+
              '</span>'+
            '</form>'+
          '</div>'+
        '</div>'
      );
      $('div.filter_window').draggable();

      //Mamufas elements belong to the carto table
      $('div.mamufas').append(
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
              '<h5>Sorry, but we are georeferencing a column...</h5>'+
              '<p>If you don\'t want to wait, <a href="#cancel_geo" class="cancel_geo">cancel de process</a> in progress.</p>'+
            '</span>'+
          '</div>'+
        '</div>'
        );
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  NEW TABLE (EMPTY)
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    startTable: function() {
      table.e.append('<span class="full_table" style="float:left; width:'+table.e.children('thead').width()+'px; height:1px"></span>');

      table.e.parent().append(
        '<div class="empty_table">'+
          '<h5>Add some rows to your table</h5>'+
          '<p>You can <a class="add_row" href="#add_row">add it manually</a></p>'+ //or <a class="import_data" href="#import_data">import data</a>
        '</div>'
      );

      table.enabled = true;
      methods.resizeTable();
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CREATE NEW ROW
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    addRow: function() {

      table.enabled = false;

      var end = table.total_r <= ((table.actual_p+1)*defaults.resultsPerPage);

   		if (end || $('div.empty_table').length>0) {
        if ($('div.empty_table').length>0) {
          $('div.empty_table').remove();
          table.e.find('tbody').remove();
          $('span.full_table').remove();
          addSingleRow(0);
        } else {
          addSingleRow(1);
        }
      } else {
        $('div.lastpage_window').show();
        $('div.mamufas').fadeIn();

        table.max_p = Math.ceil(table.total_r / defaults.resultsPerPage) - 1;
        table.min_p = table.max_p-1;
        actualPage = table.max_p;
				defaults.mode = "asc";
  			defaults.order_by = 'cartodb_id';
  			
  			//If you are viewing a filter view, it goes to normal mode
  			table.mode = 'normal';
  			$('div.stickies').remove();
  			table.e.find('thead').css({height:''});


        $.ajax({
          method: "GET",
          url: defaults.getDataUrl+table_name+'/records',
          data: {
            rows_per_page: defaults.resultsPerPage,
            page: table.min_p+'..'+table.max_p,
						mode: defaults.mode,
						order_by: defaults.order_by
          },
          headers: {"cartodbclient": true},
          success: function(data) {
            table.e.children('tbody').remove();
            methods.drawRows(defaults,data.rows,'next',table.actual_p);
            addSingleRow(2);
          }
        });
      }


      function addSingleRow(type) {
        var requestId = createUniqueId();
        requests_queue.newRequest(requestId,'add_row');

        $.ajax({
           type: "POST",
           url: defaults.getDataUrl+table_name+'/records',
           headers: {"cartodbclient": true},
           success: function(data) {

             row_id = data.id;
             $.ajax({
                method: "GET",
                url: defaults.getDataUrl+table_name,
                headers: {"cartodbclient": true},
                success: function(data) {
                  data = data.schema;
                  requests_queue.responseRequest(requestId,'ok','');
                  var options_list = '<span><h5>EDIT</h5><ul><li><a href="#">Duplicate row(s)</a></li><li><a href="#delete_row" class="delete_row">Delete row(s)</a></li></ul>' +
                                      '<div class="line"></div><h5>CREATE</h5><ul><li class="last"><a href="#add_row" class="add_row">Add new row</a></li>' +
                                      '</ul></span>';

                  if (type==0) {
                    var row = '<tbody style="padding-top:52px"><tr class="editing" r="'+row_id+'"><td class="first" r="'+row_id+'"><div><a href="#options" class="options">options</a>'+options_list+'</div></td>';
                  } else {
                    var row = '<tr class="editing" r="'+row_id+'"><td class="first" r="'+row_id+'"><div><a href="#options" class="options">options</a>'+options_list+'</div></td>';
                  }


                  for (var i = 0; i<data.length; i++) {
                    var text = '';
                    if (data[i][0]=="cartodb_id") {
                      text = row_id;
                    } else if (data[i][0]=="created_at" || data[i][0]=="updated_at") {
                      var date = new Date();
                      var test = new Date();
                      var offset = -test.getTimezoneOffset()/60;

                      text = date.getFullYear()+'-'+(zeroPad(date.getMonth()+1,2))+'-'+zeroPad(date.getDate(),2)+'T'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+'+'+zeroPad(offset,2)+':00';
                    } else {
                      text = '';
                    }
                 		row += '<td '+((data[i][0]=="cartodb_id" || data[i][0]=="created_at" || data[i][0]=="updated_at")?'class="special"':'')+' r="'+row_id+'"  c="'+ data[i][0] +'"><div '+((data[i][0]=='cartodb_id')?'':' style="width:'+table.cell_s+'px"') + '>'+text+'</div></td>';
                  }

                  var start = row.lastIndexOf('"width:');
                  var end = row.lastIndexOf('px"');
                  row = row.substring(0,start) + '"width:' + table.last_cell_s + row.substring(end);

                  if (type==0) {
                    row += '</tr></tbody>';
                    table.e.append(row);
                  } else {
                    row += '</tr>';
                    table.e.find('tbody').append(row);
                  }


                  if (type==2) {
                    table.e.parent().addClass('end');
                  }

                  //Si hay más filas de las permitidas por el reuso, borramos las '50' primeras, sumamos una a la página max, min y actual
                  table.total_r++;
                  if (table.e.children('tbody').children('tr').size()>defaults.reuseResults) {
                    table.max_p++; table.min_p++; table.actual_p++;
                    table.e.children('tbody').children('tr:lt('+defaults.resultsPerPage+')').remove();
                  } else {
                    if (table.e.children('tbody').children('tr').size()>defaults.resultsPerPage) {
                      table.max_p++; table.actual_p++;
                    }
                  }

                  $('body').animate({scrollTop:$('div.table_position').height()+'px'},500,function(){
                    methods.closeTablePopups();
                    table.enabled = true;
                  });
                  
                  $('div.empty_table').remove();
                  methods.resizeTable();
                },
                error: function(e) {
                  requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
                  table.enabled = true;
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
      params['name'] = sanitizeText(name);
      params['type'] = type.charAt(0).toUpperCase() + type.slice(1);

      methods.updateTable('/columns',params,params.column,null,"new_column","POST");
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
          table.e.children('thead').css('top','99px');
          if (($(document).scrollTop() + $(window).height())==$(document).height() || ($(document).scrollTop() + $(window).height())>$(document).height() && table.e.parent().scrollLeft()>0) {
            $('div.general_options').addClass('end');
            $('div.sql_console').addClass('end');
          } else {
            $('div.general_options').removeClass('end');
            $('div.sql_console').removeClass('end');
          }
        } else {
          $('div.general_options').removeClass('end');
          $('div.sql_console').removeClass('end');
          $('section.subheader').css('top',58-$(document).scrollTop()+'px');
          table.e.children('thead').css('top',160-$(document).scrollTop()+'px');
        }


        $('div.delete_column').fadeOut();
        $('div.change_type_column').fadeOut();


        //For paginating data
        var end = table.total_r <= ((table.actual_p + 1) * defaults.resultsPerPage);
        
        if (!table.loading && table.enabled) {
          var difference = $(document).height() - $(window).height();
          if ($(window).scrollTop()==difference && !end && table.max_p!=-1) {
            table.loading = true;
            methods.showLoader('next');
            setTimeout(function(){methods.getData(defaults,'next')},500);
          } else if ($(window).scrollTop()==0 && table.min_p!=0) {
            table.loading = true;
            table.e.parent().removeClass('end');
            methods.showLoader('previous');
            setTimeout(function(){methods.getData(defaults,'previous')},500);
          } else if (end && table.actual_p!=0) {
            table.e.parent().addClass('end');
          }
        }
      });


      table.e.parent().scroll(function(ev){
        if (($(document).scrollTop() + $(window).height())==$(document).height() || ($(document).scrollTop() + $(window).height())>$(document).height() && table.e.parent().scrollLeft()>0) {
          $('div.general_options').addClass('end');
          $('div.sql_console').addClass('end');
        } else {
          $('div.general_options').removeClass('end');
          $('div.sql_console').removeClass('end');
        }

        if ($('div.delete_row').is(':visible')) {
          $('div.delete_row').fadeOut();
        }

        //For moving first table column
        table.e.children('tbody').children('tr').children('td.first').css('left',table.e.parent().scrollLeft()+'px');
        table.e.children('thead').children('tr').children('th.first').css('left',table.e.parent().scrollLeft()+'px');
        table.e.children('thead').css('left', -table.e.parent().scrollLeft()+'px');

        methods.paginateControls();
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  SHOW PAGINATE LOADER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    showLoader: function(kind){
      if (table.min_p==0) {
        var range = (table.max_p - table.min_p + 1) * defaults.resultsPerPage;
      } else {
        var range = table.min_p * defaults.resultsPerPage + '-' + ((table.max_p + 1) * defaults.resultsPerPage);
      }

      if (kind=="previous") {
        $('div.loading_previous p.count').text('Now vizzualizing '+range+' of '+ table.total_r);
				table.e.children('tbody').css('padding','0');
				table.e.children('tbody').css('margin','0');
				// If table is filter or query mode
				var margin = '53px 0 0 0';
				if (table.mode != 'normal') {
				  margin = '93px 0 0 0';
				}
				$('div.loading_previous').css('margin',margin);
        $('div.loading_previous').show();
      } else {
        $('div.loading_next p.count').text('Now vizzualizing '+range+' of '+ table.total_r);
        $('div.loading_next').css({display:'inline',width: table.e.width() +'px'});
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  HIDE PAGINATE LOADER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    hideLoader: function() {
			table.loading = false;

      $('div.loading_next').hide();
      $('div.loading_previous').hide();
			if (table.mode!="normal") {
				table.e.children('tbody').css('padding','86px 0 0 0');
			} else {
				table.e.children('tbody').css('padding','54px 0 0 0');
			}
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  BIND EVENTS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    bindEvents: function() {
      ///////////////////////////////////////
      //  DOUBLE CLICK -> Open cell editor //
      ///////////////////////////////////////
      $(document).dblclick(function(event){
        if (table.enabled && table.mode!='query') {
       		var target = event.target || event.srcElement;
          var targetElement = target.nodeName.toLowerCase();

          if (targetElement == "div" && $(target).parent().attr('c')!=undefined && !$(target).parent().hasClass('id') && $(target).parent().attr('c')!="cartodb_id" && $(target).parent().attr('c')!="updated_at" && $(target).parent().attr('c')!="created_at") {

            if (!table.edited) {
              $('div.explain_tooltip').stop(true).hide();
              table.edited = false;
            }

            methods.closeTablePopups();
            methods.bindESCkey();

            var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
            var geo_column = $('p.geo').closest('th').attr('c');


            $('div.edit_cell p.error').hide();
            $('div.edit_cell div.months_list').hide();
            $('div.edit_cell input').removeClass('error');
            $('div.edit_cell textarea').removeClass('error');

            var target_position = $(target).parent().offset();
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
            if ($("div.table_position").width()<=($(target).parent().offset().left+table.cell_s+28)) {
              $('div.edit_cell').css('left',table.e.parent().scrollLeft()+target_position.left-215+($(target).width()/2)+'px');
            } else if (($(target).parent().offset().left+table.cell_s+28)<170) {
               $('div.edit_cell').css('left','0px');
            } else {
              $('div.edit_cell').css('left',table.e.parent().scrollLeft()+target_position.left-128+($(target).width()/2)+'px');
            }


            var type = _.detect(table.h,function(head,j){return head.name == data.column}).type;

					  if (data.value== 'GeoJSON...') {
              type = 'geojson';
              $('div.edit_cell textarea').addClass('loading');

              $.ajax({
        		    method: "GET",
        		    url: global_api_url+'queries?sql='+escape('SELECT ST_AsGeoJSON(the_geom,6) as the_geom FROM '+table_name+' WHERE cartodb_id='+data.row),
        		 		headers: {"cartodbclient":"true"},
        		    success: function(data) {
                  $('div.edit_cell textarea').val(data.rows[0].the_geom);
                  $('div.edit_cell textarea').removeClass('loading');
        		    },
        		    error: function(e) {
                  $('div.edit_cell textarea').removeClass('loading').addClass('error');
        		    }
        		  });
            }


            $('div.edit_cell div.free').hide();
            $('div.edit_cell div.boolean').hide();
            $('div.edit_cell div.date').hide();
            $('div.edit_cell div.point').hide();
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
            } else if (type=="point") {
              if (data.value=="") {
                $('div.table_position div.edit_cell div.point span input#latitude_value').val('0');
                $('div.table_position div.edit_cell div.point span input#longitude_value').val('0');
              } else {
                var point_values = data.value.replace(' ','').split(',');
                $('div.table_position div.edit_cell div.point span input#latitude_value').val(point_values[1]);
                $('div.table_position div.edit_cell div.point span input#longitude_value').val(point_values[0]);
              }
              $('div.edit_cell div.point').show();
              var len = $('div.table_position div.edit_cell div.point span input#longitude_value').text().length;
            } else {
              if (type=="number"){
                $('div.edit_cell textarea').css({'min-height' : '16px','height' : '16px' });
              }else{
                $('div.edit_cell textarea').css({'min-height' : '30px','height' : '30px'});
              }
              $('div.edit_cell div.free').show();
              if (data.value!="GeoJSON...") {
                $('div.edit_cell div.free textarea').val(data.value);
              } else {
                $('div.edit_cell div.free textarea').val('');
              }
            }

            $('div.edit_cell a.save').attr('r',data.row);
            $('div.edit_cell a.save').attr('c',data.column);
            $('div.edit_cell a.save').attr('type',type);
            $('div.edit_cell').show();

            if (type!='date' && type!='boolean' && type!='point') {
              var len = $('div.edit_cell div.free textarea').val().length;
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
        if (table.enabled && table.mode!='query') {
       		var target = event.target || event.srcElement;
          var targetElement = target.nodeName.toLowerCase();

          //Clicking in first column element + Key
       		if ((targetElement == "div" && event.ctrlKey) || (targetElement == "div" && event.metaKey)) {
            methods.closeTablePopups();

            if ($(target).closest('tr').hasClass('selecting')) {
              $(target).closest('tr').removeClass('selecting selecting_first selecting_last border');
            } else {
              $(target).closest('tr').addClass('selecting selecting_first selecting_last border');
            }

            // Check rows where
            table.e.find('tbody tr.selecting').each(function(i,ele){
              if ($(ele).prev().hasClass('selecting')) {
                $(ele).removeClass('selecting_first');
              } else {
                $(ele).addClass('selecting_first border');
              }

              if ($(ele).next().hasClass('selecting')) {
                $(ele).removeClass('selecting_last');
              } else {
                $(ele).addClass('selecting_last border');
              }
            });


            if (event.preventDefault) {
              event.preventDefault();
              event.stopPropagation();
            } else {
              event.stopPropagation();
              event.returnValue = false;
            }
          }

          //Clicking in first column element
          if (targetElement == "a" && $(target).closest('td').hasClass('first')) {
            if (!$(target).closest('tr').hasClass('selecting_first')) {
              methods.closeTablePopups();

              if (!$(target).closest('tr').hasClass('selected')) {
                $(target).closest('tr').addClass('editing');
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
      $(document).mousedown(function(event){
        if (table.enabled && table.mode!='query') {
       		var target = event.target || event.srcElement;
          var targetElement = target.nodeName.toLowerCase();

          if (targetElement == "div" && $(target).parent().is('td') && !event.ctrlKey && !event.metaKey) {

            table.e.find('tbody tr td.first div span').hide();
            table.e.find('tbody tr td.first div a.options').removeClass('selected');
            table.e.find('tbody tr').removeClass('editing');
            table.e.find('tbody tr').removeClass('selecting_first').removeClass('border');
            table.e.find('tbody tr').removeClass('selecting');
            table.e.find('tbody tr').removeClass('selecting_last');
            table.e.find('tbody tr').removeClass('selected');

            var first_row = $(target).closest('tr');
            first_row.addClass('selecting_first');
            var initial_x = first_row.position().top;

            //Show tooltip about editing cell
            if (table.edited) {
							var initial_top = $(target).closest('tr').position().top;
              var initial_left = $(target).closest('td').position().left;
              var cell_width = $(target).closest('td').width();
              // If click on the first or second row
							if (initial_top<100) {
								$('div.explain_tooltip').addClass('down').css({top:initial_x+45+'px',left:initial_left+(cell_width/2)-55+'px'});
              } else {
								$('div.explain_tooltip').removeClass('down').css({top:initial_x-45+'px',left:initial_left+(cell_width/2)-55+'px'});
							}
							$('div.explain_tooltip').hide().stop(true).fadeIn().delay(4000).fadeOut();
            }

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

            if (targetElement == "div" && $(target).parent().is('td') && !event.ctrlKey && !event.metaKey) {
              $('div.explain_tooltip').hide();
              var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
              var current_row = $(target).closest('tr');
              var current_x = current_row.position().top;
              table.e.children('tbody').children('tr').removeClass('selecting');
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
        if (table.enabled && table.mode!='query') {
       		var target = event.target || event.srcElement;
          var targetElement = target.nodeName.toLowerCase();

          if (targetElement == "div" && $(target).parent().is('td') && !event.ctrlKey && !event.metaKey) {
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
            var new_value = year+'-'+zeroPad(month,2)+'-'+zeroPad(day,2)+ 'T'+hour+'+00:00';
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
        } else if (type=="point") {
          var new_value = $('input#longitude_value').val() + ', ' + $('input#latitude_value').val();
          if ($('tbody tr td[r="'+row+'"][c="'+column+'"] div').text()!=new_value) {
            var errors = '';
            //TODO - Check pattern numbers!
         		var pattern = /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/;
            if (!pattern.test($('input#longitude_value').val())) {
              $('input#longitude_value').addClass('error');
              errors = 'lon';
            } else {
              $('input#longitude_value').removeClass('error');
            }
            if (!pattern.test($('input#latitude_value').val())) {
              $('input#latitude_value').addClass('error');
              (errors=="")?errors='lat':null;
            } else {
              $('input#latitude_value').removeClass('error');
            }

            if (errors=='') {
              var old_value = $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text();
              $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text(new_value);
              var point_values = new_value.replace(' ','').split(',');
              new_value = {"type":"Point","coordinates":[point_values[0], point_values[1]]};
              $('input#longitude_value').removeClass('error');
              $('input#latitude_value').removeClass('error');
            } else {
              $("div.edit_cell p.error").css('left',((errors=="lon")?'-5':'120')+'px');
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
            $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text((old_value!='GeoJSON...')?new_value:'GeoJSON...');
          } else {
            methods.closeTablePopups();
            return false;
          }
        }

        $('tbody tr td[r="'+row+'"][c="'+column+'"] div').attr('title',new_value);
        params[column] = new_value;
        methods.updateTable("/records/"+row,params,new_value,old_value,'update_cell',"PUT");

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
				if (table.enabled && table.mode!='query') {
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
				}
      });
      $('thead tr a.column_type').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();

        var position = $(this).position();
        var parent_div = $(this).closest('div');
        parent_div.children('span.col_types').find('li').removeClass('selected');
        var column_type = parent_div.children('p.long').children('a').text();
        column_type = column_type.charAt(0).toUpperCase() + column_type.slice(1);
        parent_div.children('span.col_types').children('p').text(column_type);
        parent_div.children('span.col_types').children('ul').children('li').children('a:contains("'+column_type+'")').parent().addClass('selected');
        parent_div.children('span.col_types').css('top',position.top-4+'px');
        parent_div.children('span.col_types').show();
        $('body').click(function(event) {
         if (!$(event.target).closest('thead tr span.col_types').length) {
           methods.closeTablePopups();
         };
        });
      });
      $('span.col_types ul li a').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();

        var parent_element = $(this).closest('span.col_types').parent().children('p.long').children('a');

        if ($(this).text().toLowerCase()!=parent_element.text()) {
          var old_value = parent_element.text();
          var new_value = $(this).text().toLowerCase();
          var column = $(this).closest('th').attr('c');

          if (new_value!='string') {
            methods.bindESCkey();

            $('div.change_type_column a.button').unbind('click');
            $('div.change_type_column a.button').click(function(ev){
              stopPropagation(ev);
              methods.closeTablePopups();
              changeColumnType(old_value,new_value,column,parent_element);
            });

            //Positionate warning tooltip
            var left_position = table.e.find('th[c="'+column+'"]').position().left;
            if ($(document).scrollTop()>58) {
              $('div.change_type_column').css('top',$(document).scrollTop()-20+'px');
            } else {
              $('div.change_type_column').css('top','37px');
            }
            $('div.change_type_column').css('left',left_position-75+'px');
            $('div.change_type_column').show();


            $('body').click(function(event) {
             if (!$(event.target).closest('div.change_type_column').length) {
               methods.closeTablePopups();
             };
            });
          } else {
            changeColumnType(old_value,new_value,column,parent_element);
          }

        }

        function changeColumnType(old_value,new_value,column,parent_element) {
          parent_element.text(new_value);
          var params = {};
          params['name'] = column;
          params['type'] = new_value;

          methods.updateTable('/columns/'+column,params,new_value,old_value,"column_type","PUT");
        }
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
            params["new_name"] = new_value;
            params["index"] = title.closest('th').index();
            methods.updateTable("/columns/"+old_value,params,new_value,old_value,'rename_column',"PUT");
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
        var left_position = table.e.find('th[c="'+column+'"]').position().left;
        var options_position = table.e.find('th[c="'+column+'"]').find('a.options').position().left;

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
           methods.closeTablePopups();
         };
        });
      });
      $('div.delete_column a.cancel_delete, div.delete_row a.cancel_delete, div.change_type_column a.cancel_change').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
      });
      $('div.delete_column a.button').livequery('click',function(ev){
        stopPropagation(ev);
        var column = $(this).attr('c');
        var params = {};
        $('body').trigger('click');
        methods.updateTable('/columns/'+column,params,null,null,"delete_column","DELETE");
      });
      $('thead tr th').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        $(this).find('a.options').trigger('click');
      });
      $('a.order_asc,a.order_desc').livequery('click',function(ev){
        stopPropagation(ev);
        var class_mode = $(this).attr('class');
        defaults.mode = (class_mode=="order_asc")?'asc':'desc';
        defaults.order_by = $(this).closest('th').attr('c');
        methods.refreshTable(0);
      })



      ///////////////////////////////////////
      //  Georeference action if...        //
      ///////////////////////////////////////
      $(document).bind('update_geometry',function(ev){
        var table_mode = ($('body').attr('view_mode') == "table");
        if (table.enabled && table_mode && !$(this).hasClass('disabled')) {
          methods.refreshTable(0);
				}
      });
      

      ///////////////////////////////////////
      //  Add - remove row events          //
      ///////////////////////////////////////
      $('a.add_row').livequery('click',function(ev){
        stopPropagation(ev);
        if (table.enabled && table.mode!='query'){
          methods.addRow();
        }
      });
      $('a.delete_row').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
        methods.bindESCkey();

        var cartodb_id = $(this).closest('tr').attr('r');
        var top_position = table.e.find('tr[r="'+cartodb_id+'"]').position().top;
        var rows_involved = $('table tbody tr.selecting').size();

        // Several rows involved or only one?
        if (rows_involved>1) {
          $('div.delete_row p').text('You are about to delete these rows. Are you sure?');
          $('div.delete_row a.button').text('Yes, delete them');
          var rows_involved_ids = '';
          $('table tbody tr.selecting').each(function(i,ele){
            rows_involved_ids += $(ele).attr('r') + ',';
          });
          rows_involved_ids = rows_involved_ids.substr(0,rows_involved_ids.length-1);
          $('div.delete_row a.button').attr('r',rows_involved_ids);
        } else {
          $('div.delete_row p').text('You are about to delete this row. Are you sure?');
          $('div.delete_row a.button').text('Yes, delete it');
          $('div.delete_row a.button').attr('r',cartodb_id);
        }

        $('div.delete_row').css('top',top_position-7+'px');
        $('div.delete_row').css('left',table.e.parent().scrollLeft()+10+'px');
        $('div.delete_row').show();

        $('body').click(function(event) {
         if (!$(event.target).closest('div.delete_row').length) {
           methods.closeTablePopups();
         };
        });
      });
      $('div.delete_row a.button').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();

        var row = $(this).attr('r');
        var params = {};
        params.primary_key = row;

        methods.updateTable('/records/'+row,params,null,null,"delete_row","DELETE");
      });


      ///////////////////////////////////////
      //  Add - remove column events       //
      ///////////////////////////////////////
      $('a.add_column').livequery('click',function(ev){
        stopPropagation(ev);
				if (table.enabled && table.mode!='query') {
					methods.closeTablePopups();
	        methods.bindESCkey();
	        table.enabled = false;

	        $('div.column_window p.error').hide();
	        $('div.column_window span.select').removeClass('error');
	        $('div.column_window input').removeClass('error');
	        $('div.column_window span.select').addClass('disabled');
	        $('div.column_window span.select a:eq(0)').text('Retreiving types...').attr('type','');
	        $('div.column_window a.column_add').addClass('disabled');
	        $('div.column_window span.select').removeClass('clicked');

	        $.ajax({
	          method: "GET",
	          url: global_api_url + 'column_types',
	          headers: {"cartodbclient": true},
	          success: function(data) {
				      //Saves the position of the String type for setting it as type per default
				      var defaultTypeIndex = undefined;
				      
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
	              //It looks for the index in data for the string type
	              if (defaultTypeIndex == undefined && data[i] == 'String'){
		              defaultTypeIndex = i;
	              }
	            }
	            $('div.column_window span.select').removeClass('disabled');
              
	            $('div.column_window span.select a.option').each(function(i,ele){
	              if ($(ele).text()=="Retreiving types...") {
		             //For getting the string type by default
	                 $(ele).text(data[defaultTypeIndex].toString()).attr('type',data[defaultTypeIndex]);
	               }
	            });
	            $('div.column_window a.column_add').removeClass('disabled');
              
	            //This adds the needed code for adding the column when pushing enter
				      $(document).keydown(function(event){
				 	      if (event.which == '13') {
						      stopPropagation(event);
        				  if ($('div.column_window input').attr('value')!='' && $('div.column_window a.option').attr('type')!='') {
        				    $(document).unbind('keydown');
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
			      	  }
			        });
				      //End of the controller for the enter key
	          },
	          error: function(e) {
	            $('div.column_window span.select a.option').text('Error retrieving types').attr('type','');
	          }
	        });

	        $('div.mamufas div.column_window').show();
	        $('div.mamufas').fadeIn(function(ev){
	          $('div.column_window div.options input').focus();
	        });
				}
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
        table.enabled = true;
        methods.closeTablePopups();
      });


      ///////////////////////////////////////
      //  SQL Editor                       //
      ///////////////////////////////////////
      // General options
      $('div.sql_window a.try_query').livequery('click',function(ev){
        var table_mode = ($('body').attr('view_mode') == "table");
        if (table.enabled && table_mode) {
          ev.preventDefault();
					$('body').attr('query_mode',"true");
          table.mode = 'query';
          methods.refreshTable(0);
        	setAppStatus();
				}
      });
			$('span.query h3 a.clear_table').livequery('click',function(ev){
				var view_mode = ($('body').attr('view_mode') === "table");
			  if (view_mode) {
			    stopPropagation(ev);
			    methods.restoreTable();
			  }
			});

      ///////////////////////////////////////
      //  Move table -> left/right         //
      ///////////////////////////////////////
      $('span.paginate a.next').click(function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();

        try {
          var scrollable = table.e.parent().scrollLeft();
          var window_width = $(window).width();
          var second = table.e.find('thead tr th:eq(2)').position().left;
          var test_1 = table.e.find('thead tr th:eq(3)').position().left;
          var test_2 = table.e.find('thead tr th:eq(4)').position().left;
          var length = test_2 - test_1;

          var column_position = Math.floor(($(window).width()-second+scrollable)/(length))+3;
          var position = table.e.find('thead tr th:eq('+column_position+')').offset().left;
          table.e.parent().animate({scrollLeft:scrollable+position-window_width},200);
        } catch (e) {
          table.e.parent().animate({scrollLeft:table.e.parent().width()},200);
        }
        methods.paginateControls();
      });
      $('span.paginate a.previous').click(function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();

        try {
          var scrollable = table.e.parent().scrollLeft();
          var window_width = $(window).width();
          var second = table.e.find('thead tr th:eq(2)').position().left;
          var test_1 = table.e.find('thead tr th:eq(3)').position().left;
          var test_2 = table.e.find('thead tr th:eq(4)').position().left;
          var length = test_2 - test_1;

          var column_position = Math.floor(($(window).width()-second+scrollable)/(length))+1;
          if (column_position > table.e.find('thead tr th').size()) {
            column_position = table.e.find('thead tr th').size()-1;
          }
          var position = $('table thead tr th:eq('+column_position+')').offset().left;
          table.e.parent().animate({scrollLeft:scrollable+position-window_width},200);
        } catch (e) {
          table.e.parent().scrollLeft(0);
        }

        methods.paginateControls();
      });


      ///////////////////////////////////////
      //  Filter by this column            //
      ///////////////////////////////////////
      $('a.filter_column').livequery('click',function(ev){
        stopPropagation(ev);
        if (table.enabled && table.mode!='query') {
          methods.closeTablePopups();
          methods.bindESCkey();
          
          // Reset input
          $('div.filter_window form input[type="text"]').val('');
          
          // Get the column
          var column_name = $(this).closest('th').attr('c');
          $('div.filter_window').attr('c',column_name);
          $('div.filter_window h3').text('Filter by '+column_name+' column');
          
          // Set filter column for the request
          defaults.filter_column = column_name;
           
          // Show filter window
          $('div.filter_window').fadeIn(function(ev){
            $('div.filter_window input[type="text"]').focus();
          });
        }
      });
      $('div.filter_window form').livequery('submit',function(ev){
        stopPropagation(ev);
        table.mode = 'filter';
        // Set filter column for the request
        defaults.filter_value = $('div.filter_window form input[type="text"]').val();
        methods.refreshTable();
      });
      $('div.filter_window a.clear_filter,div.stickies a.remove_filter').livequery('click',function(ev){
        stopPropagation(ev);
        $('body').attr('query_mode','false');
        table.mode = 'normal';
        methods.refreshTable('');
      });
      $('div.filter_window a.close').livequery('click',function(ev){
        stopPropagation(ev);
        methods.closeTablePopups();
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  KEEP SIZE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    keepSize: function(){
      //Keep the parent table div with the correct width, onresize window as well
      if ($(window).width() != table.e.parent().width()) {
        setTimeout(function(){
          methods.resizeTable();
        },500);
      }

      $(window).resize(function(ev){
        methods.resizeTable();
      });
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  PAGINATE CONTROLS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    paginateControls: function(){
      var scrollable = table.e.parent().scrollLeft();
      var window_width = $(window).width();
      var table_width = table.e.width();

   		if (window_width==table_width || (window_width-2)>=table_width || $('table tbody').length==0) {
        $('span.paginate a#previousButton').addClass('disabled');
        $('span.paginate a#nextButton').addClass('disabled');
      } else {
        if (scrollable<1) {
          $('span.paginate a#previousButton').addClass('disabled');
          $('span.paginate a#nextButton').removeClass('disabled');
     		} else if ((window_width+scrollable)==table.e.width() || (table.e.width()-window_width-scrollable)<(table.last_cell_s+28)) {
          $('span.paginate a#nextButton').addClass('disabled');
          $('span.paginate a#previousButton').removeClass('disabled');
        } else {
          $('span.paginate a#previousButton').removeClass('disabled');
          $('span.paginate a#nextButton').removeClass('disabled');
        }
      }
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  RESIZE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    resizeTable: function() {
      var parent_width = $(window).width();
      table.e.parent().width(parent_width);
      var width_table_content = ((table.e.children('thead').children('tr').children('th').size()-2)*(table.cell_s+27)) + 143;
      var head_element = table.e.children('thead').children('tr').children('th:last').children('div');
      var body_element = table.e.children('tbody').children('tr');

      //WIDTH
      if (parent_width>width_table_content) {
        $(head_element).width(parent_width - width_table_content + table.cell_s);
        $(body_element).each(function(index,element){
          $(element).children('td:last').children('div').width(parent_width - width_table_content + table.cell_s);
          table.last_cell_s = parent_width - width_table_content + table.cell_s;
        });
      }

      // HEIGTH
      var parent_height = $(window).height();
      // Reset before height
      table.e.parent().css('height','auto');

      if ((parent_height-162) > (table.e.parent().height())) {
        table.e.parent().height(parent_height-162);
      }

      //Control pagination
      methods.paginateControls();
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
        dataType: "text",
        headers: {"cartodbclient": true},
        url: defaults.getDataUrl + table_name + url_change,
        data: params,
        success: function(data) {
          requests_queue.responseRequest(requestId,'ok','');
          methods.successRequest(params,new_value,old_value,type);
        },
        error: function(e, textStatus) {
          try {
            requests_queue.responseRequest(requestId,'error',$.parseJSON(e.responseText).errors[0]);
          } catch (e) {
            requests_queue.responseRequest(requestId,'error','There has been an error, try again later...');
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
        case "rename_column":   var type  = table.h[old_value];
                                delete table.h[old_value];
                                table.h[new_value] = type;
                                $('tbody tr td[c="'+old_value+'"]').attr('c',new_value);
                                break;
        case "column_type":     methods.refreshTable('');
                                table.h[params.name] = params.type;
                                break;
        case "new_column":      methods.closeTablePopups();
                                table.h[params.name] = params.type;
                                methods.refreshTable('next');
                                break;
        case "delete_column":   delete table.h[params.name];
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
        case "update_cell":   var element = table.e.find('table tbody tr[r="'+params.row_id+'"] td[c="'+params.column_id+'"] div');
                              element.text(old_value);
                              element.attr('title',old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#666666'},300);},1000);
                              });
                              break;

        case "rename_column": var element = $('table thead tr th:eq('+params.index+') h3');
                              element.text(old_value);
                              element.closest('th').attr('c',old_value);
                              element.animate({color:'#FF3300'},300,function(){
                                setTimeout(function(){element.animate({color:'#727272'},300);},1000);
                              });
                              break;
        case "update_geometry": methods.closeTablePopups();
                              break;

        case "column_type":   var element = table.e.find('th[c="'+params.name+'"] p.long a');
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
    //  RESTORE TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    restoreTable : function() {
      table.mode = 'normal';
      $('body').attr('query_mode',"false");
      methods.refreshTable();
    },
    
    
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  DISABELD TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    disableTable : function() {
      table.enabled = false;
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  REFRESH TABLE
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    refreshTable: function(position) {
      var new_query = undefined;
      
      // If it comes from a query (from the map)
      var table_mode = ($('body').attr('query_mode') == "true");
      if (table_mode) {
        table.mode = 'query';
        new_query = true;
      }
      
			$('body').attr('view_mode','table');
      table.loading = true;

      if (position!='') {
        // Reset pages position
        table.min_p = 0;
        table.max_p = -1;
        if (position==undefined)
          position = 'next';
      } else {
        //Hide scroll loaders
        $('div.loading_previous').hide();
        $('div.loading_next').hide();
        table.scroll = $(document).scrollTop();
				new_query = true;
      }
      
      table.e.children('thead').remove();
      table.e.children('tbody').remove();
      $(document).scrollTop(0);
      table.e.parent().removeClass('end');
      methods.getData(defaults, position, new_query, true);
      table.enabled = true;
    },



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  CLOSE ALL POPUPS WINDOWS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    closeTablePopups: function() {
      methods.unbindESCkey();
      $('body').unbind('click');
      table.enabled = true;
      
      // Filter window
      $('div.filter_window').hide();
      //Column row popup
      $('div.delete_row').hide();
      //Column delete popup
      $('div.delete_column').hide();
      //Change column type warning
      $('div.change_type_column').hide();
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
        $('div.mamufas div.column_window').hide();
        $('div.mamufas div.lastpage_window').hide();
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



  /////////////////////////////
  //  START PLUGIN           //
  /////////////////////////////
  $.fn.cartoDBtable = function(method,options) {
        
    if (options!=undefined && options!=null) {
      defaults = options;
      table.enabled = defaults.enabled;
    }
    
    if (methods[method]) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
 		} else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      return methods.init.apply( this, arguments );
    }
  };
})(jQuery);