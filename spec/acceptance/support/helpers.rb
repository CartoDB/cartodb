module HelperMethods
  def login_as(user)
    visit login_path
    fill_in 'E-mail', :with => user.email
    fill_in 'Password', :with => user.email.split('@').first
    click_link_or_button 'Login'
  end
end

RSpec.configuration.include HelperMethods, :type => :acceptance
