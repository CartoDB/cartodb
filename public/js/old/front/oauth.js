
	head(function(){
		$('p a').click(function(ev){
			ev.preventDefault();
			$(this).parent().find('input').click();
		});
  });