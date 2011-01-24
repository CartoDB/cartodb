module HelperMethods

  def login_as(user)
    visit login_path
    fill_in 'your e-mail', :with => user.email
    fill_in 'your password', :with => user.email.split('@').first
    click_link_or_button 'Sign in'
  end

  def get_json(path)
    visit path
  end

end

RSpec.configuration.include HelperMethods, :type => :acceptance
