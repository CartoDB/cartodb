
    // FUNCIONALITIES
    //   - Editing table data with events
    //   - Resize columns
    //   - Pagination with ajax
    //   - Custom style
    //   - jScrollPane
    //   - Update table (remove columns and rows, add columns and rows, move columns, sort columns)
    //   - Validate fields
    //   - Rows selection for multiple edition
    //   - Floating tHead 
    //   - Floating first column 


    (function( $ ){
      
      var table;
      var loading = false;
      var page = 0;
      var defaults;
      var total = 5000;

      var methods = {
        init : function(options) {
          return this.each(function(){
      
            defaults = {  
              height: '200',  
              width: '200',
              getDataUrl: 'http://bioblitz.tdwg.org/api/taxonomy',  
              style: "cDBtable.css",
              paginateParam: "page",
              resultsPerPage: 5000
            };
            
            table = $(this)[0];
            methods.getData(defaults);
            
          });
        },

        getData : function(options) {
         //Pagination AJAX adding rows
         if (!loading) {
           loading = true;

           $.ajax({
             dataType: 'jsonp',
             method: "GET",
             url: options.getDataUrl,
             data: {
               query: 'a',
               limit: options.resultsPerPage,
               page: page
             },
             success: function(data) {
               methods.draw(options,data);
             }
           });
         }
        },

        draw: function(options,data) {
          //Draw the data
          if ($(table).html()=='') {
            var thead = '<thead><tr>';
            $.each(data[0], function(index,element){
              thead += '<th width="100"><div><h3>'+index+'</h3><p>String</p><a href="#">options</a></div></th>';
            });
            thead += "</thead></tr>";
            $(table).append(thead);
            
            //Scroll event
            methods.addScroll();
            
            //Cell click event
            methods.bindCellEvent();
            
          }
          
          if ($(table).children('tbody').length==0) {
            var tbody = '<tbody>';
          } else {
            var tbody = '';
          }
          
          //Loop all the data
          $.each(data, function(i,element){
            tbody += '<tr>';
            $.each(element, function(j,elem){
              tbody += '<td width="100" r="'+i+'" c="'+j+'"><div>'+elem+'</div></td>';
            });
            tbody += '</tr>';
          });
          $(table).append(tbody);
          methods.hideLoader();
          
        },
        
        addScroll: function() {
          $(window).scroll(function(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            if (!loading) {
              $(window).queue([]).stop(); 
              var difference = $(document).height() - $(window).height();
              if ($(window).scrollTop()==difference) {
                methods.showLoader();
                page++;
                setTimeout(function(){methods.getData(defaults)},500);
              }
            }
          });
          // $(table).parent().addClass('scroll-pane');
          // $('.scroll-pane').jScrollPane({showArrows: false});
          // $(window).resize(function(){$('.scroll-pane').jScrollPane({showArrows: false});});
        },
        
        showLoader: function(){
          $('div.loading_more').show();
        },
        
        hideLoader: function() {
          loading = false;
          $('div.loading_more').hide();
        },
        
        bindCellEvent: function() {
          $(document).click(function(event){
            var target = event.target || event.srcElement;
            var targetElement = target.nodeName.toLowerCase();

            if (targetElement == "div") {
              alert($(target).parent().attr('c')+'-'+$(target).parent().attr('r')+'-'+$(target).parent().text());
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
      };

      
      $.fn.cDBtable = function(method) {
        if (methods[method]) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          return methods.init.apply( this, arguments );
        }
      };
    })( jQuery );