# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 tags management" do

  background do
    Capybara.current_driver = :rack_test
    @user = create_user(:username => 'test')
  end

  scenario "Get tags" do
    another_user = create_user

    table1 = create_table :user_id => @user.id, :name => 'My table #1', :privacy => Table::PUBLIC, :tags => "tag 1, tag 2,tag 3, tag 3"
    table2 = create_table :user_id => @user.id, :name => 'My table #2', :privacy => Table::PRIVATE
    table3 = create_table :user_id => another_user.id, :name => 'Another table #3', :privacy => Table::PRIVATE

    get_json api_tags_url do |response|
      response.status.should be_success
      response.body.should == [{"name"=>"tag 3", "count"=>1}, {"name"=>"tag 1", "count"=>1}, {"name"=>"tag 2", "count"=>1}]
    end
  end

end