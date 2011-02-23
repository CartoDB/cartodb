

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
      date = {};
      if (str=='') {
        date.day = 1;
        date.month = 1;
        date.month_text = "January";
        date.year = 2011;
        date.time = '00:00:00';
      } else {
        try {
          var split_date_hour = str.split(' ');
          if (split_date_hour.length>1) {
            var split_date = split_date_hour[0].split('-');
            date.time = split_date_hour[1];
            date.day = split_date[2];
            date.month = split_date[1];
            date.month_text = getMonthString(date.month);
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
    
