# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Dashboard", %q{
  In order to allow users to manage their databases
  As a User
  I want to be able to visit my databases and manage them
} do

  scenario "Login and visit my dashboard" do
    user = create_user({:quota_in_bytes => 50000000,
                        :table_quota    => 100,
                        :account_type   => 'Coronelli',
                        :private_tables_enabled => true})
    the_other = create_user({:quota_in_bytes => 50000000,
                             :table_quota    => 100,
                             :account_type   => 'Coronelli',
                             :private_tables_enabled => true})
    t = Time.now - 6.minutes
    Timecop.travel(t)
    20.times do |i|
      create_table :user_id => user.id, :name => "Table ##{20 - i}", :privacy => Table::PRIVATE, :tags => 'personal'
    end
    20.times do |i|
      create_table :user_id => the_other.id, :name => "Other Table ##{20 - i}", :privacy => Table::PRIVATE, :tags => 'vodka'
    end
    Timecop.travel(t + 1.minute)
    create_table :user_id => user.id, :name => 'My check-ins', :privacy => Table::PRIVATE,
                 :tags => "4sq, personal, feed aggregator"
    Timecop.travel(t + 2.minutes)
    create_table :user_id => user.id, :name => 'Downloaded movies', :privacy => Table::PRIVATE,
                 :tags => "movies, personal"
    Timecop.travel(t + 3.minutes)
    create_table :user_id => the_other.id, :name => 'Favourite restaurants', :privacy => Table::PRIVATE,
                 :tags => "restaurants"
    Timecop.travel(t + 4.minutes)
    create_table :user_id => the_other.id, :name => 'Secret vodkas', :privacy => Table::PRIVATE,
                 :tags => "vodka, drinking"

    Timecop.travel(t + 6.minutes)

    log_in_as user

    within(:css, "header") do
      page.should have_link("CartoDB")
    end

    page.should have_css("footer")

    page.should have_css("ul#tablelist")

    page.should have_content("22 tables in your account")

    within("ul#tablelist li:eq(1)") do
      page.should have_link("downloaded_movies")
      page.should have_content("PRIVATE")
      # page.should have_content("4 minutes ago")
      within(:css, "span.tags") do
        page.should have_content("movies")
        page.should have_content("personal")
      end
    end

    within("ul.your_tables li:eq(2)") do
      page.should have_link("my_check_ins")
      page.should have_content("PRIVATE")
      # page.should have_content("5 minutes ago")
      within(:css, "span.tags") do
        page.should have_content("4sq")
        page.should have_content("personal")
        page.should have_content("feed aggregator")
      end
    end

    within("ul.your_tables li:eq(22).last") do
      page.should have_link("table_20")
      page.should have_content("PRIVATE")
      # page.should have_content("6 minutes ago")
      within(:css, "span.tags") do
        page.should have_content("personal")
      end
    end

    page.should have_content("BROWSE BY TAGS")

    page.should have_css("ul li:eq(1) a span", :text => "personal")
    page.should have_css("ul li a span", :text => "4sq")
    page.should have_css("ul li a span", :text => "feed aggregator")
    page.should have_css("ul li a span", :text => "movies")

    click_link_or_button('downloaded_movies')

    page.should have_css("h2 a", :text => 'downloaded_movies')
    page.should have_css("p.status", :text => 'PRIVATE')
    within(:css, "span.tags") do
      page.should have_content("movies")
      page.should have_content("personal")
    end

    page.should have_no_selector("footer")

    visit '/dashboard'
    click_link_or_button('log out')
    page.current_path.should == '/login'
  end

  scenario "Browse by tags" do
    user = create_user
    the_other = create_user
    t = Time.now - 6.minutes
    Timecop.travel(t)
    20.times do |i|
      create_table :user_id => user.id, :name => "Table ##{20 - i}", :privacy => Table::PRIVATE, :tags => 'personal'
    end
    20.times do |i|
      create_table :user_id => the_other.id, :name => "Other Table ##{20 - i}", :privacy => Table::PRIVATE, :tags => 'vodka'
    end
    Timecop.travel(t + 1.minute)
    create_table :user_id => user.id, :name => 'My check-ins', :privacy => Table::PRIVATE,
                 :tags => "4sq, personal, feed aggregator"
    Timecop.travel(t + 2.minutes)
    create_table :user_id => user.id, :name => 'Downloaded movies', :privacy => Table::PRIVATE,
                 :tags => "movies"
    Timecop.travel(t + 3.minutes)
    create_table :user_id => the_other.id, :name => 'Favourite restaurants', :privacy => Table::PRIVATE,
                 :tags => "restaurants"
    Timecop.travel(t + 4.minutes)
    create_table :user_id => the_other.id, :name => 'Secret vodkas', :privacy => Table::PRIVATE,
                 :tags => "vodka, drinking"

    Timecop.travel(t + 6.minutes)

    log_in_as user

    within(:css, "header") do
      page.should have_link("CartoDB")
      page.should have_content(user.email)
    end

    page.find("ul li a span", :text => "4sq").click

    page.should have_content("1 table in your account")

    page.should have_css("ul li:eq(1) a", :text => "view all tables")
    page.should have_css("ul li:eq(2) a span", :text => "personal")
    page.should have_css("ul li a span", :text => "4sq")
    page.should have_css("ul li a span", :text => "feed aggregator")
    page.should have_css("ul li a span", :text => "movies")

    within("ul.your_tables li:eq(1)") do
      page.should have_link("my_check_ins")
      page.should have_content("PRIVATE")
      within(:css, "span.tags") do
        page.should have_content("4sq")
      end
    end

    page.find("ul li a span", :text => "personal").click

    page.should have_content("21 tables in your account")

    within("ul.your_tables li:eq(1)") do
      page.should have_link("my_check_ins")
      page.should have_content("PRIVATE")
      # page.should have_content("5 minutes ago")
      within(:css, "span.tags") do
        page.should have_content("4sq")
        page.should have_content("personal")
        page.should have_content("feed aggregator")
      end
    end

    within("ul.your_tables li:eq(2)") do
      page.should have_link("table_1")
      page.should have_content("PRIVATE")
    end

  end

  # TODO: implement it
  # scenario "Remove a table" do
  #   user = create_user
  #   create_table :user_id => user.id, :name => 'My check-ins', :privacy => Table::PUBLIC,
  #                :tags => "4sq, personal, feed aggregator"
  #   create_table :user_id => user.id, :name => 'Downloaded movies', :privacy => Table::PRIVATE,
  #                :tags => "movies, personal"
  #
  #   log_in_as user
  #
  #   # debugger
  #
  #   page.driver.browser.execute_script("$('ul.your_tables li:eq(1)').trigger('mouseover')")
  #   page.find("ul.your_tables li a.delete").click
  #
  #   page.find("div.delete_window a.cancel").click
  #   # page.find("ul.your_tables li:eq(1) p.status").click
  #   page.find("ul.your_tables li:eq(1) a.delete").click
  #   page.find("ul.your_tables li:eq(1) a.confirm_delete").click
  # end

  scenario "Create a new table with default attributes" do
    user = create_user

    log_in_as user

    page.find('a.new_table').click
    page.find('div.create_window span.bottom input#create_table').click

    page.should have_css("h2 a", :text => 'untitled_table')
  end

  scenario "Get OAuth credentials" do
    user = create_user

    log_in_as user

    click "Your api keys"
    page.should have_content("Using the key and secret you can access CartoDB from external applications.")

    within("span.form_block") do
      page.should have_content("CONSUMER KEY")
      page.should have_css("input[@value='#{user.client_application.key}']")
    end

    within("span.form_block.last") do
      page.should have_content("CONSUMER SECRET")
      page.should have_css("input[@value='#{user.client_application.secret}']")
    end

    old_key = user.client_application.key
    page.find("span.end_key a.submit").click
    user.reload
  end

end
