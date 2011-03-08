# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Superadmin's users administration" do

  background do
    Capybara.default_driver    = :rack_test
    @admin_user  = create_admin
    @common_user = create_user
    4.times{ create_user }
  end

  scenario "Only admin users can access the superadmin panel" do
    visit superadmin_path
    current_path.should == login_path

    login_as @common_user
    visit superadmin_path
    current_path.should == dashboard_path

    visit logout_path

    login_as @admin_user
    visit superadmin_path
    current_path.should == superadmin_path
  end

  scenario "Admins can edit an existing user" do
    login_as @admin_user

    visit superadmin_path
    page.should have_css('ul.users li a', :count => 6)

    click_link 'Admin - admin@example.com'

    page.should have_content "Id: #{@admin_user.id}"
    page.should have_content 'Username: Admin'
    page.should have_content 'E-mail: admin@example.com'
    page.should have_content "Database name: cartodb_test_user_#{@admin_user.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_content 'Has administrator role'

    click_link 'Edit user'
    fill_in 'Username', :with => 'Fulano'
    fill_in 'Email', :with => 'fulano@example.com'
    fill_in 'Password', :with => 'fulanito'
    click_button 'Update User'

    page.should have_content 'User updated successfully'
    page.should have_css('ul.users li a', :count => 6)

    click_link 'Fulano - fulano@example.com'

    page.should have_content "Id: #{@admin_user.id}"
    page.should have_content 'Username: Fulano'
    page.should have_content 'E-mail: fulano@example.com'
    page.should have_content "Database name: cartodb_test_user_#{@admin_user.id}_db"
    page.should have_content 'Tables count: 0'
    page.should have_content 'Has administrator role'

  end

end