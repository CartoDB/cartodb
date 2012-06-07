
      // THEAD COLUMN
      
      /* th */
      var th = '<th c="{{name}}" type="{{type}}">'+
                  '<div {{#cartodb_id}}style="width:75px"{{/cartodb_id}}  {{^cartodb_id}}style="width:{{cellsize}}px"{{/cartodb_id}}>'+
                    '<span class="long">'+
                      '<h3>{{name}}</h3>'+
                      '{{#geo}}<p class="geo public">geo</p>{{/geo}}'+
                      '<input type="text" value="{{name}}" disabled/>'+
                    '</span>'+
                    '<p class="long">'+
                      '<a class="static">{{type}}</a>' +
                    '</p>'+
                    '<a class="options" href="#options">options</a>'+
                    '<span class="col_ops_list">' +
                      '<h5>ORDER</h5>' +
                      '<ul>' +
                        '<li><a class="order_asc">Order by ASC</a></li>' +
                        '<li><a class="order_desc">Order by DESC</a></li>' +
                      '</ul>' +
                      '<div class="line"></div>'+
                      '<h5>FILTER</h5>' +
                      '<ul>' +
                        '<li><a href="#filter_by_column" class="filter_column">Filter by this column</a></li>' +
                      '</ul>' +
                    '</span>'+
                  '</div>'+
                '</th>'
      ,	generic_td =  '<td {{#allowed}}class="special"{{/allowed}} r="{{cartodb_id}}" c="{{column}}">'+
                          '<div class="{{^geojson}}italic{{/geojson}}" title="{{value}}" {{^is_cartodb_id}}style="width:{{cellsize}}px"{{/is_cartodb_id}}>{{value}}</div>'+
                        '</td>';