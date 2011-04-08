# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Invitations", %q{
  In order to let users use CartoDB
  As a prudent developer
  I want to let users to access to CartoDB in batches
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
    ask_for_invitation_email.body.should match /Thanks, we have received your request/
    ask_for_invitation_email.body.should match /We are still on private beta and is going to take us some time to approve your request/
    ask_for_invitation_email.body.should match /We will email you back/
    ask_for_invitation_email.body.should match /once we are ready,/
    ask_for_invitation_email.body.should match /CartoDB is a geospatial database in the cloud that allows you to develop location aware applications quickly and easily. If you feel you  really desperately need your invitation,/
    ask_for_invitation_email.body.should match /reply to this email/
    ask_for_invitation_email.body.should match /and explain us why./
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

  scenario "A user activates his account" do
    user = create_user
    user.enable(true)
    user.save

    visit edit_invitation_path(user, :invite_token => user.invite_token)

    page.should have_content 'Welcome to CartoDB'
    page.should have_content 'Complete the following information before start using CartoDB'
    fill_in 'your e-mail', :with => user.email
    fill_in 'your password', :with => 'fuuuuuuuuuu'
    fill_in 'retype your password', :with => 'uffffffff'

    click 'Create your account'

    page.should have_content "Password doesn't match confirmation"
    fill_in 'your e-mail', :with => user.email
    fill_in 'your password', :with => 'fuuuuuuuuuu'
    fill_in 'retype your password', :with => 'fuuuuuuuuuu'

    click 'Create your account'

    user = User[:id => user.id]
    user.invite_token.should be_nil
    user.invite_token_date.should be_nil

    current_path.should be == dashboard_path

  end

  scenario "A user cannot activate an account with an invalid invite token" do

    user = create_user

    # User activation with an empty invite token
    visit edit_invitation_path(user, :invite_token => user.invite_token)

    current_path.should be == homepage

    # User activation with an expired token
    Timecop.travel(31.days.since)

    current_path.should be == homepage

  end

  scenario "A user cannot activate his account with the invite token of another user" do
    good_user = create_user
    good_user.enable(true)
    evil_user = create_user

    visit edit_invitation_path(evil_user, :invite_token => good_user.invite_token)

    current_path.should be == homepage

  end
end
