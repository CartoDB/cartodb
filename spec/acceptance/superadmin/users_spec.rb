# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Superadmin's users administration" do

  background do
    @admin_user  = create_admin
    @common_user = create_user
    4.times{ create_user }
  end

  scenario "Only admin users can access the superadmin panel" do
    visit superadmin_path
    current_path.should == login_path

    log_in_as @common_user
    visit superadmin_path
    current_path.should == dashboard_path
    page.should have_no_link 'Superadmin'

    visit logout_path

    log_in_as @admin_user

    click_link 'Superadmin'
    current_path.should == superadmin_path
  end

  scenario "Admins can edit an existing user" do
    log_in_as @admin_user

    visit superadmin_path
    page.should have_css('ul.users li a', :count => 6)

    click_link 'Admin'

    page.should have_content "Id: #{@admin_user.id}"
    page.should have_content 'Username: Admin'
    page.should have_content 'E-mail: admin@example.com'
    page.should have_content 'Subdomain: admin'
    page.should have_content "Database name: cartodb_test_user_#{@admin_user.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_content 'Has administrator role'
    page.should have_content 'Enabled user'

    click_link 'Edit user'
    fill_in 'Username', :with => 'Fulano'
    fill_in 'Email', :with => 'fulano@example.com'
    fill_in 'Password', :with => 'fulanito'
    click_button 'Update User'
    page.should have_content 'User updated successfully'
    page.should have_css('ul.users li a', :count => 6)

    click_link 'Fulano'

    page.should have_content "Id: #{@admin_user.id}"
    page.should have_content 'Username: Fulano'
    page.should have_content 'E-mail: fulano@example.com'
    page.should have_content 'Subdomain: admin'
    page.should have_content "Database name: cartodb_test_user_#{@admin_user.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_content 'Has administrator role'
    page.should have_content 'Enabled user'

  end

  scenario "Admins can create new users" do
    log_in_as @admin_user

    visit superadmin_path

    click_link 'Add new user'

    fill_in 'Username', :with => 'Fulano'
    fill_in 'Email', :with => 'fulano@example.com'
    fill_in 'Password', :with => 'fulanito'
    fill_in 'Subdomain', :with => 'vizzuality'
    check 'Superman'
    click_button 'Create User'

    page.should have_content 'User created successfully'
    page.should have_css('ul.users li a', :count => 7)

    click_link 'Fulano'

    fulano = User.all.last

    page.should have_content "Id: #{fulano.id}"
    page.should have_content 'Username: Fulano'
    page.should have_content 'E-mail: fulano@example.com'
    page.should have_content "Database name: cartodb_test_user_#{fulano.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_content 'Has administrator role'
  end

  scenario "Admins can remove an existing user" do
    log_in_as @admin_user

    visit superadmin_path
    page.should have_css('ul.users li a', :count => 6)

    click_link "#{@common_user.username}"

    page.should have_content "Id: #{@common_user.id}"
    page.should have_content "Username: #{@common_user.username}"
    page.should have_content "E-mail: #{@common_user.email}"
    page.should have_content "Database name: cartodb_test_user_#{@common_user.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_no_content 'Has administrator role'

    disable_confirm_dialogs
    click_link 'Remove user'

    page.should have_content 'User removed successfully'
    page.should have_css('ul.users li a', :count => 5)
    page.should have_no_link "#{@common_user.username} - #{@common_user.email}"
  end

  scenario "Editing a user without touching his password doesn't change it" do
    user = create_user :username => 'test', :email => 'test@example.com', :password => 'test'
    log_in_as @admin_user

    visit superadmin_path
    page.should have_css('ul.users li a', :count => 7)

    click_link 'test'

    page.should have_content "Id: #{user.id}"
    page.should have_content 'Username: test'
    page.should have_content 'E-mail: test@example.com'
    page.should have_content "Database name: cartodb_test_user_#{user.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_no_content 'Has administrator role'
    page.should have_content 'Enabled user'

    click_link 'Edit user'
    fill_in 'Username', :with => 'Fulano'
    fill_in 'Email', :with => 'fulano@example.com'
    fill_in 'Password', :with => ''
    click_button 'Update User'

    visit logout_path

    visit login_path
    fill_in 'e-mail', :with => 'fulano@example.com'
    fill_in 'password', :with => 'test'
    click_link_or_button 'Log in'

    current_path.should be == dashboard_path
  end

end
