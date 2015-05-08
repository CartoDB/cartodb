# encoding: utf-8

shared_examples_for "layers controllers" do

  describe '#show legacy tests' do

    before(:all) do
      @user = create_user(
        username: 'test',
        email:    'client@example.com',
        password: 'clientex'
      )

      host! 'test.localhost.lan'
    end

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
      delete_user_data @user
      @table = create_table :user_id => @user.id
    end

    after(:all) do
      @user.destroy
    end


    let(:params) { { :api_key => @user.api_key } }


    it "Get all user layers" do
      layer = Layer.create kind: 'carto'
      layer2 = Layer.create kind: 'tiled'
      @user.add_layer layer
      @user.add_layer layer2

      get_json api_v1_users_layers_index_url(params.merge(user_id: @user.id)) do |response|
        response.status.should be_success
        response.body[:total_entries].should   eq 2
        response.body[:layers].size.should     eq 2
        response.body[:layers][0]['id'].should eq layer.id
        response.body[:layers][1]['id'].should eq layer2.id
      end
    end


  end

end
