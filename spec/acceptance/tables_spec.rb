# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Tables" do

  background do
    @user = create_user
    @table = create_table :user_id => @user.id, :name => 'Twitter followers', :privacy => Table::PRIVATE,
                          :tags => 'twitter'

    log_in_as @user

    click_link_or_button("twitter_followers")
  end

  scenario "can access embedded map if public" do 
    click_link_or_button("PRIVATE")
    page.find(".privacy_window .public a").click
    visit "#{page.current_path}/embed_map"    
  end

  pending "cannot access embedded map if private" do 
    visit "#{page.current_path}/embed_map"    
  end

  # By the moment threre is no privacy in the table
  pending "Toggle the privacy of a table" do
    # Toggle to private
    click_link_or_button("PUBLIC")
    page.find("span.privacy_window ul li.private a").click
    sleep 1
    page.should have_css("p.status", :text => 'private')
  end

  pending "Change the name from a table" do
    click_link_or_button("twitter_followers")
    page.find("form#change_name input[name='title']").set("New name")
    page.find_button('Save').click

    page.find("h2").text.should == "new_name"
  end

  pending "Add and remove tags from a table" do
    click_link_or_button("add tags")
    page.find("li.tagit-new input.tagit-input").set("tag1,")
    page.find_link("Save").click

    page.find("div.performing_op p").text.should == 'Loading...'
    sleep 1
    page.find("div.performing_op p").text.should == 'Your table tags have been updated'
    page.all("span.tags p")[0].text.should == 'twitter'
    page.all("span.tags p")[1].text.should == 'tag1'

    click_link_or_button("add tags")
    page.find("li.tagit-new input.tagit-input").set("tag3,")
    page.find_link("Save").click

    page.find("div.performing_op p").text.should == 'Your table tags have been updated'
    page.all("span.tags p")[0].text.should == 'twitter'
    page.all("span.tags p")[1].text.should == 'tag1'
    page.all("span.tags p")[2].text.should == 'tag3'

    click_link_or_button("add tags")
    page.find("li.tagit-choice", :text => "tag3").find("a.remove_tag").click
    page.find_link("Save").click

    page.all("span.tags p")[0].text.should == 'twitter'
    page.all("span.tags p")[1].text.should == 'tag1'
    page.all("span.tags p").size.should == 2
  end

  pending "Delete a table" do
    click_link_or_button("delete table")
    click_link_or_button("Delete this table")

    page.current_path.should == dashboard_path
  end

  pending "Update the value from a cell" do
    @user.in_database do |user_database|
      10.times do
        user_database.run("INSERT INTO \"#{@table.name}\" (Name,Latitude,Longitude,Description) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude},'#{String.random(100)}')")
      end
    end

    sleep 2

    visit page.current_path

    page.execute_script("$('table#carto_table td[r=1][c=name] div').trigger('dblclick')")
    page.find("div.edit_cell textarea").set("wadus")
    page.find("div.edit_cell a.save").click
    page.find("table#carto_table tr[@r='1'] td[@r='1'][c='name']").text.should == "wadus"

    visit page.current_path
    page.find("table#carto_table tr:eq(1)[@r='1'] td[@r='1'][c='name']").text.should == "wadus"
  end

  pending "Can't update cartodb_id field" do
    @user.in_database do |user_database|
      2.times do
        user_database.run("INSERT INTO \"#{@table.name}\" (Name,Latitude,Longitude,Description) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude},'#{String.random(100)}')")
      end
    end

    sleep 2

    visit page.current_path

    page.execute_script("$('table#carto_table td[r=1][c=cartodb_id] div').trigger('dblclick')")
    page.find("div.edit_cell textarea").should_not be_visible
  end

  pending "Can't update cartodb_id field" do
    @user.in_database do |user_database|
      2.times do
        user_database.run("INSERT INTO \"#{@table.name}\" (Name,Latitude,Longitude,Description) VALUES ('#{String.random(10)}',#{Float.random_latitude}, #{Float.random_longitude},'#{String.random(100)}')")
      end
    end

    sleep 2

    visit page.current_path

    page.execute_script("$('table#carto_table td[r=1][c=cartodb_id] div').trigger('dblclick')")
    page.find("div.edit_cell textarea").should_not be_visible
  end

  pending "Visit a table that doesn't exist" do
    visit "/tables/666"

    page.should have_content("The page you are looking for doesn't exist")
  end

  pending "Add a new column" do
    page.find("th[c='cartodb_id'] a.options").click
    page.find("th[c='cartodb_id'] span.col_ops_list ul li.last a.add_column").click

    page.find("div.column_window div.options input:eq(1)").set("Age")
    page.find("div.column_window div.options span.select a.option").click
    page.find("div.column_window div.options span.select div.select_content ul li a[href='#Number']").click

    page.find("div.column_window a.column_add").click

    sleep 1

    page.find("th[c='age'][type='number'] h3").text.should == "age"
  end
  
end
