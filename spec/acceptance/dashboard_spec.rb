require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Dashboard", %q{
  In order to allow users to manage their databases
  As a User
  I want to be able to visit my databases and manage them
} do

  scenario "Login and visit my dashboard and the public tables" do
    user = create_user

    # create_table :owner => user, :name => 'My check-ins', :privacy => Table::PUBLIC

    login_as user

    within(:css, "header") do
      page.should have_link("CartoDB")
      page.should have_content(user.email)
    end

    page.should have_css("ul.tables_list li.selected a", :text => "Your tables")
    page.should have_css("ul.tables_list li a", :text => "Public tables")

    click_link_or_button('close session')

    page.current_path.should == homepage
  end
end
