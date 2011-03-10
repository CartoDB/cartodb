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

    random_email = String.random(5) + '@example.com'

    fill_in "email", :with => random_email

    expect {
      click "Sign up"
    }.to change{ActionMailer::Base.deliveries.size}.from(0).to(1)

    page.should have_content("Thank you!")

    ask_for_invitation_email = ActionMailer::Base.deliveries.first

    ask_for_invitation_email.subject.should be == 'Thanks for signing up for cartodb beta'
    ask_for_invitation_email.from.should include('wadus@cartodb.com')
    ask_for_invitation_email.to.should include(random_email)
    ask_for_invitation_email.body.should match /You are invited to CartoDB/
    ask_for_invitation_email.body.should match /Develop location aware applications quickly and easily/
    ask_for_invitation_email.body.should match /We are happy/
    ask_for_invitation_email.body.should match /to invite you to use our/
    ask_for_invitation_email.body.should match /brand new service/
    ask_for_invitation_email.body.should match /CartoDB is a geospatial database in the cloud that allows you to develop location aware applications quickly and easily./
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
