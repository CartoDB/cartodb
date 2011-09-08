

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
      return str.replace(/[^a-zA-Z 0-9 _]+/g,'').replace(' ','_').toLowerCase();
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
    /* Get lat&lon from GeoJSON  */
    /*============================================================================*/
    function geoPosition(str) {
      var json = $.parseJSON(str);
      if (json.type=="Point") 
        return new google.maps.LatLng(json.coordinates[1],json.coordinates[0]);
      else 
        return null;
    }
    
    
