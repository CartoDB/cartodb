# encoding: utf-8

shared_examples_for "records controllers" do

  describe '#show legacy tests' do

    before(:all) do
      @user = create_user(
        username: 'test',
        email:    'client@example.com',
        password: 'clientex'
      )
      @api_key = @user.api_key

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


    let(:params) { { :api_key => @user.api_key, table_id: @table.name } }


    it "Insert a new row and get the record" do
      payload   = {
        name: "Name 123",
        description: "The description"
      }

      post_json api_v1_tables_records_create_url(params.merge(payload)) do |response|
        response.status.should be_success
        response.body[:cartodb_id].should == 1
      end

      get_json api_v1_tables_records_show_url(params.merge(id: 1)) do |response|
        response.status.should be_success
        response.body[:cartodb_id].should == 1
        response.body[:name].should == payload[:name]
        response.body[:description].should == payload[:description]
      end

    end


  end

end
