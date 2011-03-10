# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Invitations", %q{
  In order to let users use CartoDB
  As a prudent developer
  I want to let users to acess to CartoDB in batches
} do

  scenario "Get an invitation" do
    user = create_user

    visit homepage

    fill_in "email", :with => user.email

    click "Sign up"

    page.should have_content("Email is already taken")

    fill_in "email", :with => String.random(5) + '@example.com'

    click "Sign up"

    page.should have_content("Thank you!")
  end

  scenario "Invited users can't login" do
    visit homepage
    fill_in 'email', :with => 'invitation@example.com'
    click 'Sign up'

    visit login_path
    fill_in 'e-mail', :with => 'invitation@example.com'
    fill_in 'password', :with => 'invitation@example.com'
    click_link_or_button 'Log in'

    page.should have_css("input[@type=text].error")
    page.should have_css("input[@type=password].error")
    page.should have_content("Your account or your password is not ok")

  end
end
