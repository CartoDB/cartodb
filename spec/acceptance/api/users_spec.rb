# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 columns management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  scenario "Get standard information for the user" do    
    @user
    get_json api_user_url(@user.id) do |response|
      response.body.should == {:username          => "test", 
                               :account_type      => "FREE", 
                               :private_tables    =>true,
                               :table_quota       => 5, 
                               :table_count       => 0,                               
                               :remaining_table_quota => 5, 
                               :byte_quota        => 104857600, 
                               :remaining_byte_quota  => 103231488.0, 
                               :api_calls         => (1..30).map{|i| i}}       
      response.status.should be_success      
    end
  end
end

