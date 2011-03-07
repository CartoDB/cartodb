module HelperMethods

  def login_as(user)
    visit login_path
    fill_in 'your e-mail', :with => user.email
    fill_in 'your password', :with => user.email.split('@').first
    click_link_or_button 'Sign in'
  end

  def authenticate_api(user)
    post '/sessions/create', {:email => user.email, :password => user.email.split('@').first}
  end

  def get_json(path, params = {})
    get path, params
  end

  def put_json(path, params = {})
    put path, params
  end

  def post_json(path, params = {})
    post path, params
  end

  def delete_json(path)
    delete path
  end

  def click(*args)
    click_link_or_button(*args)
  end

end

RSpec.configuration.include HelperMethods, :type => :acceptance
