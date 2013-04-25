module HelperMethods

  def log_in_as(user)
    visit login_path
    fill_in 'email', :with => user.email
    fill_in 'password', :with => user.password || user.email.split('@').first
    click_link_or_button 'Sign in'
  end

  def authenticate_api(user)
    post '/sessions/create', {:email => user.email, :password => user.email.split('@').first}
  end

  def click(*args)
    click_link_or_button(*args)
  end

  def disable_confirm_dialogs
    # Disables confirm dialogs in selenium
    page.execute_script('window.confirm = function() { return true; }')
  end

  def peich
    save_and_open_page
  end

end

RSpec.configuration.include HelperMethods, :type => :acceptance
