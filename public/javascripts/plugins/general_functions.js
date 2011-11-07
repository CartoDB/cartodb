

    /*============================================================================*/
    /* Use unique  */
    /*============================================================================*/
    function createUniqueId() {
      var uuid= '';
      for (i = 0; i < 32; i++) {
       uuid += Math.floor(Math.random() * 16).toString(16);
      }
      return uuid;
    }



    /*============================================================================*/
    /* Sanitize texts  */
    /*============================================================================*/
    function sanitizeText(str) {
      return str.replace(/[^a-zA-Z 0-9 _]+/g,'').replace(/ /g,'_').replace(/--/g,'-').toLowerCase();
    }



    /*============================================================================*/
    /* Convert Date string to Date object  */
    /*============================================================================*/
    function parseDate(str) {
      var date = {};
  
      if (str=='') {
        date.day = 1;
        date.month = 1;
        date.month_text = "January";
        date.year = 2011;
        date.time = '00:00:00';
      } else {
        try {
          var split_date_hour = str.split('T');
          if (split_date_hour.length>1) {
            var split_date = split_date_hour[0].split('-');
            date.time = split_date_hour[1].split('+')[0];
            date.day = split_date[2];
            date.month = split_date[1];
            date.month_text = getMonthString(date.month-0);
            date.year = split_date[0];
          } else {
            date.day = 1;
            date.month = 1;
            date.month_text = "January";
            date.year = 2011;
            date.time = '00:00:00';
          }
        } catch (e) {
          date.day = 1;
          date.month = 1;
          date.month_text = "January";
          date.year = 2011;
          date.time = '00:00:00';
        }
      }
      return date;
    }



    /*============================================================================*/
    /* Convert month string to month number  */
    /*============================================================================*/
    function getMonthNumber(month) {
      switch (month) {
        case "January": return 1;
        case "February": return 2;
        case "March": return 3;
        case "April": return 4;
        case "May": return 5;
        case "June": return 6;
        case "July": return 7;
        case "August": return 8;
        case "September": return 9;
        case "October": return 10;
        case "November": return 11;
        default: return 12;
      }
    }



    /*============================================================================*/
    /* Convert month number to month string  */
    /*============================================================================*/
    function getMonthString(month) {
      switch (month) {
        case 1: return "January";
        case 2: return "February";
        case 3: return "March";
        case 4: return "April";
        case 5: return "May";
        case 6: return "June";
        case 7: return "July";
        case 8: return "August";
        case 9: return "September";
        case 10: return "October";
        case 11: return "November";
        default: return 'December';
      }
    }



    /*============================================================================*/
    /* Stop propagation events  */
    /*============================================================================*/
    function stopPropagation(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    function stopMapPropagation(ev) {
      try{
        ev.stopPropagation();
      }catch(e){
        event.cancelBubble=true;
      };
    }



    /*============================================================================*/
    /* Zero padding for numbers */
    /*============================================================================*/
    function zeroPad(num,count) {
      var numZeropad = num + '';
      while(numZeropad.length < count) {
        numZeropad = "0" + numZeropad;
      }
      return numZeropad;
    }


    /*============================================================================*/
    /* Select a text range into within a textArea  */
    /*============================================================================*/
    $.fn.selectRange = function(start, end) {
      return this.each(function() {
        if(this.setSelectionRange) {
          this.focus();
          this.setSelectionRange(start,end);
        } else if(this.createTextRange) {
          var range = this.createTextRange();
          range.collapse(true);
          range.moveEnd('character', end);
          range.moveStart('character', start);
          range.select();
        }
      });
    };

    
    /*============================================================================*/
    /* Convert GeoJSON to coords  */
    /*============================================================================*/
    function transformGeoJSON(str) {
      var paths = [];
      var bounds = new google.maps.LatLngBounds();
      var json = $.parseJSON(str);
      var coords = json.coordinates;
      var type = json.type.toLowerCase();
      var center = new google.maps.LatLng();
      
      if (type=="point") {
        paths.push(new google.maps.LatLng(json.coordinates[1],json.coordinates[0]));
        center = paths[0];
      } else if (type=="polygon" || type=="multipolygon") {
        for (var i = 0; i < coords.length; i++) {
          for (var j = 0; j < coords[i].length; j++) {
            var path = [];
            for (var k = 0; k < coords[i][j].length; k++) {
              var ll = new google.maps.LatLng(coords[i][j][k][1],coords[i][j][k][0]);
              bounds.extend(ll);
              path.push(ll);
            }
            paths.push(path);
          }
        }
        center = bounds.getCenter();
      } else {
        for (var i = 0; i < coords.length; i++) {
          var path = [];
          for (var j = 0; j < coords[i].length; j++) {
            var ll = new google.maps.LatLng(coords[i][j][1],coords[i][j][0]);
            bounds.extend(ll);
            path.push(ll);
          }
          paths.push(path);
        }
        center = bounds.getCenter();
      }
      
      return {paths:paths,center:center,type:type}
    }


    function transformToGeoJSON(geometries,type) {
      type = type.toLowerCase();
      var str = '{"type":"'+((type=="multipolygon")?"MultiPolygon":"MultiLineString")+'","coordinates":[';
      _.each(geometries,function(pol,i){
        var points = pol.getPath().getArray();
        str += (type=="multipolygon")?'[[':'[';
        _.each(points,function(point,i){
          str += '['+point.lng()+','+point.lat()+'],'
        });
        str += (type=="multipolygon")?'['+points[0].lng()+','+points[0].lat()+'],':'';
        if (points.length>0) {
          str = str.substr(0, str.length-1);
        }
        str += (type=="multipolygon")?']],':'],';
      });
      str = str.substr(0, str.length-1);
      str += ']}';
      return str;
    }



		function isURL(s) {
			var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
			return regexp.test(s);
		}
