

  importScripts('/javascripts/plugins/jquery.hive.pollen.js');


  $(function (data) {

    // `this` equals WorkerGlobalScope

    $.ajax.get({  
      url: 'http://maps.googleapis.com/maps/api/geocode/json?address=Gran+Via+18,+Madrid&sensor=false',  
      dataType:'jsonp', 
      //data: $.param(data.message), 
      success: function(jsonObj) { 

        //  Assume its a list of companies with some contact data.

        $.send( 
          $.unique( 
            $.filter(jsonObj, function (obj) { 

              //  If not passed in the data property above, we could filter here.
              //  Not the most efficient way, the example is really to illustrate Pollen's syntax

              if ( $.inStr(obj.company, data.company) ) { 
                return true; 
              } 
              return false;

            })
          )
        );

        // OR...

        $.send( 
          $.query(

            //  Get filtered data with a JSONPath query
            "?company='"+data.company+"'", 
            jsonObj

          )
        );
      } 
    });      


  });



    // var geoAddresses;
    // var googlegeocorder = "http://maps.googleapis.com/maps/api/geocode/json?address=";
    // 
    // 
    // onmessage = function (event) {
    //   // receive the image data
    //   var data = event.data;
    //   geoAddresses  = data.addresses;
    //   importScripts('http://maps.google.com/maps/api/js?sensor=true');
    //   setTimeout("updateData()",1000);
    // }
    // 
    // 
    // function updateData() {
    // 
    //   var first = geoAddresses.shift();
    //   //var url = String(first).replace(/ /g,'+');
    //   var url = googlegeocorder+(String(first).replace(/ /g,'+'))+'&sensor=true';
    //   postMessage(url);
    // 
    //   var geocoder = new google.maps.Geocoder();
    //   geocoder.geocode( {'address': first }, function(data, status){postMessage(data);});
      
      // var ScriptTag = document.createElement("script"); 
      // ScriptTag.setAttribute("type", "text/javascript"); 
      // ScriptTag.setAttribute("src", googlegeocorder+first.replace(' ','+')+'&sensor=false&callback=HandleRequest');
      // var hHead = document.getElementsByTagName("head")[0]; 
      // hHead.appendChild(ScriptTag);

      // var first = geoAddresses.shift();
      // 
      // var xmlhttp=new XMLHttpRequest();
      // xmlhttp.open("GET",googlegeocorder+first.replace(' ','+')+'&sensor=false&callback=?',true);
      // xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      // xmlhttp.onreadystatechange=function() {
      //   if (xmlhttp.readyState==4 && xmlhttp.status==200) {
      //     arg = {
      //       response: xmlhttp.responseText
      //     }
      //     postMessage(arg);
      //   }
      // }
      // xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      // xmlhttp.send("");

      // http.open("GET", myurl + "?id=" + escape(param), true);
      // http.onreadystatechange = useHttpResponse;
      // http.send(null);
    //}