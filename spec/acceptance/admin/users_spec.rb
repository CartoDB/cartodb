# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "User updating" do
  background do
    @user = create_user
  end

  scenario "Edit logged in user with valid data" do
    log_in_as @user

    click_link 'settings'

    find('#user_email')['disabled'].should be_true
    find('#user_password')['disabled'].should be_true
    find('#user_password_confirmation')['disabled'].should be_true

    click_link 'verify your identity'

    fill_in 'Insert your current password', :with => @user.password
    click_button 'Unlock'

    fill_in 'YOUR EMAIL', :with => 'fuuuuuu@cartodb.com'
    fill_in 'YOUR PASSWORD', :with => 'fuuuuuuuu'
    fill_in 'CONFIRM PASSWORD', :with => 'fuuuuuuuu'

    click_button 'Save changes'

    page.should have_content('Your data was updated successfully.')

    visit logout_path

    @user.email    = 'fuuuuuu@cartodb.com'
    @user.password = 'fuuuuuuuu'
    log_in_as @user
    current_path.should == dashboard_path
  end

  scenario "Destroy logged in user" do
    log_in_as @user

    click_link 'settings'

    page.should have_css('a.delete_account.disabled')

    click_link 'verify your identity'

    fill_in 'Insert your current password', :with => @user.password
    click_button 'Unlock'

    click_link 'Delete your account'

    page.should have_content('You are about to delete your account')
    page.should have_content('You will not be able to recover your tables and their data.')

    expect{ click_button 'Yes, I want to delete my account' }.to change{ User.count }.by(-1)

    page.should have_content("Your account has been removed")
    page.should have_content("It would be great to know a little bit about your reasons. If you feel comfortable with it, send us an email")

    current_path.should == '/byebye'

  end

end