module HelperMethods

  def login_as(user)
    visit login_path
    fill_in 'E-mail', :with => user.email
    fill_in 'Password', :with => user.email.split('@').first
    click_link_or_button 'Login'
  end

  def get_json(path)
    # set_json_headers
    visit path
  end

  def set_json_headers
    header 'Accept', 'application/json'
    header 'Content-Type', 'application/json'
  end
end

RSpec.configuration.include HelperMethods, :type => :acceptance
