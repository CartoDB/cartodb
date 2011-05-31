var set_style_url = TILESERVER + "/tiles/users/" + user_id + "/layers/" + table_name + "/set_style";
var get_style_url = TILESERVER +  "/tiles/users/" + user_id + "/layers/" + table_name + "/get_style?callback=?";

$('#carto_css').live('click', function(){
  
  // there is a whole REST interface for getting and setting styles per user (like, for example, if you wanted to list all the styles a user has, or all the layers that share a style). Ask me about it for more. 
  // In the meantime, this is just a shortcut URL for creating and setting a new style for a map.

  var default_point_style = "#" + table_name + "{marker-fill: #FF6600;\nmarker-opacity: 1;\nmarker-width: 8;\nmarker-line-color: white;\nmarker-line-width: 3;\nmarker-line-opacity: 0.9;\nmarker-placement: point;\nmarker-type: ellipse;\nmarker-allow-overlap: true;\n}"

  var style = $.getJSON(get_style_url, function(data){
    var style;
    if (data.style){
      style = data.style;
    } else {
      style = default_point_style; // I should do this all server side really and return default polygon style too.
    }
    
    
    // This should be a POST, but cross domain problems with cross site XJAX means we fudge it for now
    $('body').prepend('<form id="carto_form" method="GET" action="' + set_style_url + '" id="map_style" style="padding:15px; width:400px; height:300px; z-index:99999; position:absolute; top:0; left:0; background:white;"><textarea name="style" rows="50" cols="40" style="height:250px">' + style + '</textarea><br> <input type="submit" value="Submit" /> | <a href="#" id="close">close</a><br /></div>');
  });
});

$('#carto_form #close').live('click', function(){
  
  $(this).parent().remove();
});


$('a.try_css').live('click',function(){
  $.ajax({
    url: set_style_url + escape($('textarea#css_editor').val()),
    success: function(data) {
      console.log(data);
    }
  });
});





