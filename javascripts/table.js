
    
    $(document).ready(function(){
      //Fix tabs content position
      //fixContentPosition();
      
      //$.getJSON('/javascripts/test.json',function(result){
        //console.log(result);
      //});

      //$('table').flexigrid({height:'auto',striped:false});
      
      // for (var i=0; i<2000; i++) {
      //   $('table tbody').append(
      //   '<tr>' +
      //     '<td c="0" r="'+i+'">data 1</td>'+ 
      //     '<td c="1" r="'+i+'">data 2</td>'+ 
      //     '<td c="2" r="'+i+'">data 3</td>'+ 
      //     '<td c="3" r="'+i+'">data 4</td>'+
      //     '<td c="4" r="'+i+'">data 5</td>'+ 
      //     '<td c="5" r="'+i+'">data 6</td>'+ 
      //     '<td c="6" r="'+i+'">data 7</td>'+ 
      //     '<td c="7" r="'+i+'">data 8</td>'+
      //     '<td c="8" r="'+i+'">data 9</td>'+ 
      //     '<td c="9" r="'+i+'">data 10</td>'+ 
      //     '<td c="10" r="'+i+'">data 11</td>'+ 
      //     '<td c="11" r="'+i+'">data 12</td>'+
      //   '</tr>');
      // }


      $("table#cDBtable").cDBtable();
      
      
      // $('table tr td').live('dblclick',function(){
      //   alert(
      //     $(this).attr('c') + '->' + $(this).attr('r') + '->' + $(this).text()
      //   );
      // });
      
      // $(window).resize(function(){fixContentPosition()});
    });
    
    // function fixContentPosition() {
    //   if ($('table').is(':visible')) {
    //     //$('table').height($(window).height()-162);
    //   } else {
    //     $('div#map').height($(window).height()-162);
    //   }
    // }
    
    
    // function changeTo(ev,kind){
    //   ev.stopPropagation();
    //   ev.preventDefault();
    //   
    //   if (kind=="table") {
    //     if (!$('table').is(':visible')) {
    //       $("ul.tab_menu li").removeClass('selected');
    //       $("ul li a:contains('Table')").parent().addClass('selected');
    //       $('table').toggle();
    //       $('div#map').toggle();
    //       fixContentPosition()
    //     }
    //   } else {
    //     if (!$('div#map').is(':visible')) {
    //       $("ul.tab_menu li").removeClass('selected');
    //       $("ul li a:contains('Map')").parent().addClass('selected');
    //       $('table').toggle();
    //       $('div#map').toggle();
    //       
    //       if ($('div#map svg').size()==0) {
    //         $('div#map').append('<script type="text/javascript" src="/javascripts/maps/map.js"></script>');
    //       }
    //       
    //     }
    //   }
    //   
    // }