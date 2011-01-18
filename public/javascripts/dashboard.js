

    $(document).ready(function(){
      $('a.close').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        // $('div.requests_info').fadeTo(500,0, function(){
        //   $('div.requests_info').animate({height:0},300);
        //   $('div.inner_content').delay(100).animate({paddingTop:0},200);
        // });
        $('div.requests_info').fadeOut();
      });
      
      $('ul.your_tables li.last').hover(function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 -11px');
      }, function(){
        $('div.tables_list div.left div.bottom_white_medium').css('background-position','0 0');
      });
    });