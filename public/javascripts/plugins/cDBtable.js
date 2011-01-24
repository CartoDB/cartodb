
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

  var methods = {
    init : function() {
      return this.each(function(){
        table = $(this)[0];
        methods.getData(defaults, 'next');
        methods.keepSize();
      });
    },



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
       //dataType: 'jsonp',
       method: "GET",
       url: options.getDataUrl,
       data: {
         rows_per_page: options.resultsPerPage,
         page: actualPage
       },
       success: function(data) {
         if (data.total_rows==0) {
           //Start new table
           if ($(table).children('thead').length==0) {methods.drawColumns(data.columns);}
           methods.startTable();
         } else {
           total = data.total_rows;
           if (data.rows.length>0) {
             methods.drawRows(options,data.rows,direction,actualPage);
             if ($(table).children('thead').length==0) {methods.drawColumns(data.columns);}  
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


    drawColumns: function(data) {
      //Draw the columns headers
      var thead = '<thead><tr><th class="first"><div></div></th>';
      $.each(data,function(index,element){
        var ul_list = '<span>' +
                        '<ul>' +
                          '<li><a href="#">Order by this column</a></li>' +
                          '<li><a href="#">Filter by this column</a></li>' +
                          '<li><a href="#">Rename column</a></li>' +
                          '<li><a href="#">Change data type</a></li>' +
                          '<li><a href="#">Delete column</a></li>' +
                          '<li class="last"><a href="#">Add new column</a></li>' +
                        '</ul>' +
                      '</span>';
        thead += '<th width="100">'+
                    '<div>'+
                      '<h3>'+element[0]+'</h3>'+
                      '<p>'+element[1]+'</p>'+
                      '<a class="options" href="#">options</a>'+
                      ul_list+
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


    drawRows: function(options,data,direction,page) {
      
      if ($(table).children('tbody').length==0) {
        var tbody = '<tbody>';
      } else {
        var tbody = '';
      }

      
      //Loop all the data
      $.each(data, function(i,element){
        var options_list =  '<span>' +
                              '<ul>' +
                                '<li><a href="#">Duplicate row</a></li>' +
                                '<li><a href="#">Delete row</a></li>' +
                                '<li class="last"><a href="#">Add new row</a></li>' +
                              '</ul>' +
                            '</span>';
        tbody += '<tr r="'+element.identifier+'"><td class="first" r="'+ element.identifier +'"><div><a href="#" class="options">options</a>'+options_list+'</div></td>';
        $.each(element, function(j,elem){
          tbody += '<td width="100" r="'+ element.identifier +'" c="'+ j +'"><div>'+elem+'</div></td>';
        });
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

      //Save operation loader
      $(table).parent().parent().children('section.subheader').append(
      '<div class="performing_op">' +
        '<p class="loading">Loading...</p>'+
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

    },
    
    startTable: function() {      
      $(table).parent().append(
        '<div class="empty_table">'+
          '<h5>Add some rows to your table</h5>'+
          '<p>You can <a href="#">add it manually</a> or <a href="#">import a file</a></p>'+
        '</div>'
      );
      
      methods.resizeTable();
      
    },


    addScroll: function() {

      $('div.table_position').scroll(function(ev){
        //For moving first table column
        $(table).children('tbody').children('tr').children('td.first').css('left',$('div.table_position').scrollLeft()+'px');
        $(table).children('thead').children('tr').children('th.first').css('left',$('div.table_position').scrollLeft()+'px');
      });


      $(window).scroll(function(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        //For moving thead when scrolling
        if ($(window).scrollTop()>58) {
          $('section.subheader').css('top',$(window).scrollTop()-1+'px');
          $(table).children('thead').css('top',$(window).scrollTop()-60+'px');
        } else {
          $('section.subheader').css('top','58px');
          $(table).children('thead').css('top','0px');
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
    },


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


    hideLoader: function() {
      loading = false;
      $('div.loading_next').hide();
      $('div.loading_previous').hide();
      $(table).children('tbody').css('padding','53px 0 0 0');
      $(table).children('tbody').css('margin','5px 0 0 0');
    },


    bindCellEvents: function() {

      //Cell events
      $(document).click(function(event){
        var target = event.target || event.srcElement;
        var targetElement = target.nodeName.toLowerCase();

        if (targetElement == "div" && $(target).parent().attr('c')!=undefined) {
          var target_position = $(target).parent().offset();
          var data = {row: $(target).parent().attr('r'),column:$(target).parent().attr('c'),value:$(target).html()};
          $('tbody tr[r="'+data.row+'"]').addClass('editing');
          $('div.edit_cell').css('top',target_position.top-192+'px');
          $('div.edit_cell').css('left',target_position.left-80+'px');
          $('div.edit_cell textarea').text(data.value);
          $('div.edit_cell a.save').attr('r',data.row);
          $('div.edit_cell a.save').attr('c',data.column);
          $('div.edit_cell').show();
        }


        //Clicking in first column element
        if (targetElement == "a" && $(target).parent().parent().hasClass('first')) {
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
        }

        if (event.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          event.stopPropagation();
          event.returnValue = false;
        }
      });


      //Head options event
      $('thead tr a.options').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();

        if (!$(this).hasClass('selected')) {
          $('tbody tr td.first a.options').removeClass('selected');
          $('tbody tr td.first span').hide();

          $('thead tr a.options').removeClass('selected');
          $('thead tr span').hide();
          $(this).addClass('selected');
          $(this).parent().children('span').show();

          $('body').click(function(event) {
            if (!$(event.target).closest('thead tr span').length) {
              $('thead tr span').hide();
              $('thead tr a.options').removeClass('selected');
              $('body').unbind('click');
            };
          });

        } else {
          $(this).removeClass('selected');
          $(this).parent().children('span').hide();
          $('body').unbind('click');
        }

      });


      //Error tooltip
      $("td.error div").livequery('mouseenter',
        function() {
          var position = $(this).offset();
          $('div.error_cell').css('left',position.left-35+'px');
          $('div.error_cell').css('top',position.top-280+'px');
          //$('div.error_cell div.inner').css('opacity','0');
          $('div.error_cell').show();
          //$('div.error_cell div.inner').css('marginTop','120px');
          //$('div.error_cell div.inner').stop().animate({opacity:1,marginTop:'0px'},300);
       });
       $("td.error div").livequery('mouseleave',
          function() {
            //$('div.error_cell div.inner').stop().animate({opacity:0,marginTop:'-120px'},200,function(){
              $('div.error_cell').hide();
            //});
       });



       //Saving new edited value
       $("div.edit_cell a.save").livequery('click',function(ev){
         ev.stopPropagation();
         ev.preventDefault();
         var row = $(this).attr('r');
         var column = $(this).attr('c');
         $('tbody tr td[r="'+row+'"][c="'+column+'"] div').text($("div.edit_cell textarea").val());
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


      //SQL Editor
      $('div.general_options div.sql_console span a.close').livequery('click',function(){
        $('div.general_options div.sql_console').hide();
        $('div.general_options ul').removeClass('sql');
      });


      //General options
      $('div.general_options ul li a.sql').livequery('click',function(){
        $('div.general_options div.sql_console').show();
        $('div.general_options ul').addClass('sql');
      });



    },
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
    
    resizeTable: function() {
      $('div.table_position').width($(window).width());
      var parent_width = $(window).width();
      var width_table_content = (($(table).children('thead').children('tr').children('th').size()-1)*128) + 66;
      var head_element = $(table).children('thead').children('tr').children('th:last').children('div');
      var body_element = $(table).children('tbody').children('tr');
      
      // WIDTH
      if (parent_width>width_table_content) {
        $(head_element).width(128 + parent_width-width_table_content);
        $(body_element).each(function(index,element){
          $(element).children('td:last').children('div').width(128 + parent_width-width_table_content);
        });
      } else {
        $(head_element).width(128);
        $(body_element).each(function(index,element){
          $(element).children('td:last').children('div').width(128);
        });
      }
      
      // HEIGTH
      var parent_height = $(window).height();
      if ((parent_height-162)>($(table).parent().height())) {
        $(table).parent().height(parent_height-162);
      }
    }
  };


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