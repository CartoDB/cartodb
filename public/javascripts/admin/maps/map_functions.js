

    function getMarkers() {
      var api_key = "";
      var query = "select *," +
                  "ST_X(ST_Transform(the_geom, 4326)) as lon_, ST_Y(ST_Transform(the_geom, 4326)) as lat_ " +
                  "from " + table_name;
      $.ajax({
        method: 'GET',
        url: "/v1/",
        data: ({api_key: api_key, sql: query}),
        headers: {'cartodbclient':true},
        dataType: 'jsonp',
        success: function(result) {
          drawMarkers(result.rows);
        },
        error: function(req, textStatus, e) {
          hideLoader();
        }
      });
    }
    
    
    function drawMarkers(table_markers) {
      _.each(table_markers,function(occ,i){
        var latlng = new google.maps.LatLng(occ.lat,occ.lon);
        var marker = new google.maps.Marker({
          position: latlng,
          icon: generateDotter('red'),
          flat: true,
          clickable: false,
          map: map
        });
      });
    }
    
    function generateDotter(color) {
      var radius = 3;

      var el = document.createElement('canvas');
      el.width = radius * 2;
      el.height = radius * 2;

      var ctx = el.getContext('2d');
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      return el.toDataURL();
    }