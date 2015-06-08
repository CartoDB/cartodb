# encoding: utf-8

shared_examples_for "maps controllers" do

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
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
      delete_user_data @user
      @table = create_table :user_id => @user.id
    end

    after(:all) do
      @user.destroy
    end


    let(:params) { { :api_key => @user.api_key } }


    it "Get map information" do
      map = create_map({ user_id: @user.id, table_id: @table.id })

      get_json api_v1_maps_show_url(params.merge({ id: map.id })) do |response|
        response.status.should be_success
        response.body[:id].should == map.id
        response.body[:user_id].should == map.user_id
        response.body[:provider].should == map.provider
        response.body[:bounding_box_sw].should == map.bounding_box_sw
        response.body[:bounding_box_ne].should == map.bounding_box_ne
        response.body[:center].should == map.center
        response.body[:zoom].should == map.zoom
        response.body[:view_bounds_sw].should == map.view_bounds_sw
        response.body[:view_bounds_ne].should == map.view_bounds_ne
        response.body[:legends].should == map.legends
        response.body[:scrollwheel].should == map.scrollwheel
      end
    end

  end

end
