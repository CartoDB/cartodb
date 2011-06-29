
	head(function(){
    
		$('form a').click(function(ev){
			ev.stopPropagation();
			ev.preventDefault();
			var class_name = $(this).attr('class');
			if (class_name=="forget") {
				$('form p.title').text('Recover your password');
				$('form input.login').val('Send email');
				$(this)
					.text('Back to login')
					.removeClass('forget')
					.addClass('login');
				$('span.password').animate({opacity:0},150,function(){
					$(this).animate({height:0},150,function(){
						$(this).hide();
					});
				});
				$('form input').removeClass('error');
				$('div.error_content').hide();
			} else {
				$('form p.title').text('Please login');
				$('form input.login').val('Log in');
				$(this)
					.text('Did you forget your password?')
					.removeClass('login')
					.addClass('forget');
				$('span.password').show();
				$('span.password').animate({height:'70px'},100,function(){
					$(this).animate({opacity:1},150);
				});
			}
		});

    $('div.error_content').delay(2000).fadeOut();
  });