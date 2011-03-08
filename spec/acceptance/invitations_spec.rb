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

    page.find("input#email").set(user.email)
    click "Sign up"

    page.should have_content("This email is already taken")

    page.find("input#email").set(String.random(5) + '@example.com')
    click "Sign up"

    page.should have_content("Thank you!")
  end
end
