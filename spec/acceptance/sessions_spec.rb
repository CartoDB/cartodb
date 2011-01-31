require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Sessions" do

  scenario "Login in the application" do
    user = create_user

    visit login_path
    fill_in 'your e-mail', :with => user.email
    fill_in 'your password', :with => 'blablapassword'
    click_link_or_button 'Sign in'

    page.should have_css("input[@type=text].error")
    page.should have_css("input[@type=password].error")
    page.should have_content("Your account or your password is not ok")

    fill_in 'your e-mail', :with => user.email
    fill_in 'your password', :with => user.email.split('@').first
    click_link_or_button 'Sign in'
  end
end
