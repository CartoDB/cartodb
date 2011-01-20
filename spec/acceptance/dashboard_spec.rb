require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Dashboard", %q{
  In order to allow users to manage their databases
  As a User
  I want to be able to visit my databases and manage them
} do

  scenario "Login and visit my dashboard and the public tables" do
    user = create_user
    the_other = create_user
    t = Time.now - 5.minutes
    Timecop.travel(t)
    create_table :user_id => user.id, :name => 'My check-ins', :privacy => Table::PUBLIC
    Timecop.travel(t + 1.minute)
    create_table :user_id => user.id, :name => 'Downloaded movies', :privacy => Table::PRIVATE
    Timecop.travel(t + 2.minutes)
    create_table :user_id => the_other.id, :name => 'Favourite restaurants', :privacy => Table::PUBLIC
    Timecop.travel(t + 3.minutes)
    create_table :user_id => the_other.id, :name => 'Secret vodkas', :privacy => Table::PRIVATE
    Timecop.travel(t + 5.minutes)

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
      page.should have_content("Last operation 4 minutes ago")
    end

    within("ul.your_tables li:eq(2).last") do
      page.should have_link("My check-ins")
      page.should have_content("PUBLIC")
      page.should have_content("Last operation 5 minutes ago")
    end

    click_link_or_button('Downloaded movies')

    page.should have_css("h2", :text => 'Downloaded movies')
    page.should have_css("p.status", :text => 'PRIVATE')

    page.should have_no_selector("footer")

    click_link_or_button('CartoDB')
    click_link_or_button('Public tables')

    page.should have_content("1 Public table in cartoDB")

    within("ul.your_tables li:eq(1)") do
      page.should have_link("Favourite restaurants")
      page.should have_content("PUBLIC")
    end

    click_link_or_button('Favourite restaurants')

    page.should have_css("h2", :text => 'Favourite restaurants')
    page.should have_css("p.status", :text => 'PUBLIC')

    click_link_or_button('close session')

    page.current_path.should == login_path
  end
end
