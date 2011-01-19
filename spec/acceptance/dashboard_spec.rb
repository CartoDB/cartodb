require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Dashboard", %q{
  In order to allow users to manage their databases
  As a User
  I want to be able to visit my databases and manage them
} do

  scenario "Login and visit my dashboard and the public tables" do
    user = create_user
    create_table :user_id => user.id, :name => 'My check-ins', :privacy => Table::PUBLIC
    create_table :user_id => user.id, :name => 'Downloaded movies', :privacy => Table::PRIVATE

    login_as user

    within(:css, "header") do
      page.should have_link("CartoDB")
      page.should have_content(user.email)
    end

    page.should have_css("footer")

    page.should have_css("ul.tables_list li.selected a", :text => "Your tables")
    page.should have_css("ul.tables_list li a", :text => "Public tables")

    page.should have_content("2 tables in your account")

    within("ul.your_tables li:eq(1)") do
      page.should have_link("Downloaded movies")
      page.should have_content("PRIVATE")
    end

    within("ul.your_tables li:eq(2).last") do
      page.should have_link("My check-ins")
      page.should have_content("PUBLIC")
    end

    click_link_or_button('Downloaded movies')

    page.should have_css("h2", :text => 'Downloaded movies')
    page.should have_css("p.status", :text => 'PRIVATE')

    page.should have_no_selector("footer")

    click_link_or_button('close session')

    page.current_path.should == login_path
  end
end
