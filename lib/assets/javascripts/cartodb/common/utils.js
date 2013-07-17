
  
  /*
   *  Utils for CartoDB App
   */
  
  cdb.Utils = {};


  /*
   *  Strip html tags from a value.
   *  input ->  string with input text (example: '<a href="#whoknows">Jamon</a> </br> <p>Vamos</p>')
   *  allowed -> allowed html tags in the result (example: '<a>')
   *
   *  return -> '<a href="#whoknows">Jamon</a> Vamos'
   */

  cdb.Utils.stripHTML = function(input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    if (!input) return '';
    return input.replace(tags, function ($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
  }


  /*
   *  Remove events attached in html code.
   *  input ->  string with input text (example: '<a href="#whoknows" onClick="alert('jamon')">Jamon</a>')
   *
   *  return -> '<a href="#whoknows">Jamon</a>'
   */

  cdb.Utils.removeHTMLEvents = function(input) {
    if (input) {
      return input.replace(/ on\w+="[^"]*"/g, '');  
    } else {
      return '';
    }
    
  }