# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 users management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
  end

  scenario "Get standard information for the user by id" do
    layer = Layer.create :kind => 'carto', :order => 2
    layer2 = Layer.create :kind => 'tiled', :order => 1
    @user.add_layer layer
    @user.add_layer layer2

    get_json api_user_url(@user.id) do |response|
      response.body.should == {:id                    => @user.id,
                               :username              => "test", 
                               :account_type          => "FREE", 
                               :private_tables        => true,
                               :table_quota           => 5, 
                               :table_count           => 0,                               
                               :remaining_table_quota => 5, 
                               :byte_quota            => 104857600, 
                               :remaining_byte_quota  => 104857600.0,
                               :layers                => [{"options"=>nil, "kind"=>"tiled", "infowindow"=>nil, "id"=>layer2.id, "order"=>1}, {"options"=>nil, "kind"=>"carto", "infowindow"=>nil, "id"=>layer.id, "order"=>2}],
                               :api_key               => @user.get_map_key,
                               :api_calls             => (1..30).map{|i| i}}       
      response.status.should be_success      
    end
  end

  pending "Get standard information without api_key" do
    get_json "#{api_url_prefix}/users/#{@user.id}" do
      response.status.should == 401
    end
  end

  scenario "Get standard information for the user by username" do    
    @user
    get_json api_user_url(@user.username) do |response|
      response.status.should be_success      
    end
  end
end

