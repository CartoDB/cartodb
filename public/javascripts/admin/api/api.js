
  head(function(){
    $('div.error_content').delay(4000).fadeOut();
		$('div.notification').delay(4000).fadeOut();

    $('span.end_key a.open_confirm_renew').click(function(ev){
      stopPropagation(ev);
      $('div.mamufas div.renew_window').show();
      $('div.mamufas').fadeIn();
      bindESC();
    });

    $('a.confirm_renew').click(function(e){
      var csrf_token = $('meta[name=csrf-token]').attr('content'),
          csrf_param = $('meta[name=csrf-param]').attr('content');

      stopPropagation(e);

      var form = $('<form method="post" action=""></form>');
      var metadata_input = '<input name="_method" value="delete" type="hidden" />';
      if (csrf_param != null && csrf_token != null) {
        metadata_input += '<input name="'+csrf_param+'" value="'+csrf_token+'" type="hidden" />';
      }
      form.hide().append(metadata_input).appendTo('body');
      form.submit();
    });
    
    
    //OAuth
    $('a.remove_key').click(function(ev){
      stopPropagation(ev);
      $('div.mamufas div.delete_window a.confirm_delete').attr('key',$(this).attr('key'));
      
      var domain = $(this).attr('domain').replace('http://','');
      $('div.mamufas div.delete_window h3').text('You are about to remove '+ domain);
      $('div.mamufas div.delete_window').show();
      $('div.mamufas').fadeIn();
      bindESC();
    });
    
    $('a.confirm_delete').click(function(ev){
      stopPropagation(ev);
      $('#remove_api_key_'+$(this).attr('key')).submit();
    });
    
    //API KEY
    $('a.regenerate_api_key').click(function(ev){
      stopPropagation(ev);      
      $('div.mamufas div.delete_window').show();
      $('div.mamufas').fadeIn();
      bindESC();
    });
    
    $('a#confirm_regen').click(function(ev){
      stopPropagation(ev);
      $('#regenerate_api_key').submit();
    });
    
    //Close mamufas
    $('a.close_delete,a.cancel').click(function(ev){
      stopPropagation(ev);
      unbindESC();
      $('div.mamufas').fadeOut(function(){
        $('div.delete_window').hide();
        $('div.renew_window').hide();
      });
    });
  });



  function bindESC() {
    $(document).keydown(function(event){
      if (event.which == '27') {
        $('div.mamufas').fadeOut();
        unbindESC();
      }
    });
  }
  function unbindESC() {
    $(document).unbind('keydown');
    $('body').unbind('click');
  }