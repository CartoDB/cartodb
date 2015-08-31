# encoding: utf-8

shared_examples_for "assets controllers" do

  describe '#show legacy tests' do

    before(:all) do
      @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
      AWS.stub!
    end

    before(:each) do
      stub_named_maps_calls
      delete_user_data @user
      host! 'test.localhost.lan'
    end

    after(:all) do
      stub_named_maps_calls
      @user.destroy
    end

    let(:params) { { :api_key => @user.api_key } }

    it "gets all assets" do
      get_json(api_v1_users_assets_index_url(user_id: @user), params) do |response|
        response.status.should be_success
        response.body[:assets].size.should == 0
      end

      3.times { FactoryGirl.create(:asset, user_id: @user.id) }

      get_json(api_v1_users_assets_index_url(user_id: @user), params) do |response|
        response.status.should be_success
        response.body[:assets].size.should == 3
      end
    end

  end

end
