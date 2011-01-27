require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Tables" do

  background do
    @user = create_user
    @table = create_table :user_id => @user.id, :name => 'Twitter followers', :privacy => Table::PUBLIC

    login_as @user

    click_link_or_button("Twitter followers")
  end

  scenario "Toggle the privacy of a table" do
    # Toggle to private
    click_link_or_button("PUBLIC")
    page.find("span.privacy_window ul li.private a").click

    page.should have_css("p.status", :text => 'private')
    page.find("div.performing_op p.success").text.should == 'The status has been changed'

    # Toggle to public
    page.find("p.status a").click
    page.find("span.privacy_window ul li.public a").click

    page.should have_css("p.status", :text => 'public')
    page.find("div.performing_op p.success").text.should == 'The status has been changed'
  end

  scenario "Change the name from a table" do
    click_link_or_button("Twitter followers")
    page.find("form#change_name input[name='title']").set("New name")
    page.find_button('Save').click

    page.find("h2").text.should == "New name"
  end
end
