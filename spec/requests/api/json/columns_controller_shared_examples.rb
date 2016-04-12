# encoding: utf-8

shared_examples_for "columns controllers" do

  describe '#show legacy tests' do

    before(:all) do
      @user = FactoryGirl.create(:valid_user)
    end

    before(:each) do
      stub_named_maps_calls
      delete_user_data @user
      @table = create_table :user_id => @user.id
    end

    after(:all) do
      stub_named_maps_calls
      @user.destroy
    end

    let(:params) { { api_key: @user.api_key, table_id: @table.name, user_domain: @user.username } }


    it "gets the columns from a table" do
      get_json api_v1_tables_columns_index_url(params) do |response|
        response.status.should be_success
        # Filter out timestamp columns for compatibility as they won't be added in new cartodbfy
        (response.body - default_schema - [["created_at", "date"],["updated_at", "date"]]).should be_empty
      end
    end

    it "adds a new column to a table" do
      post_json api_v1_tables_columns_create_url(params), { :type => "Number", :name => "postal code" } do |response|
        response.status.should be_success
        response.body.should == {
          :name => "postal_code",
          :type => "double precision",
          :cartodb_type => "number"
        }
      end
    end

    it "Try to add a new column of an invalid type" do
      post_json api_v1_tables_columns_create_url(params), { :type => "integerrr", :name => "postal code" } do |response|
        response.status.should == 400
      end
    end

    it "Get the type of a column" do
      get_json api_v1_tables_columns_show_url(params.merge({id: "name"})) do |response|
        response.status.should be_success
        response.body[:type].should == "string"
      end
    end

    it "Get the type of a column that doesn't exist" do
      get_json api_v1_tables_columns_show_url(params.merge({id: "namiz"})) do |response|
        response.status.should == 404
      end
    end

    it "Update the type of a given column" do
      put_json api_v1_tables_columns_update_url(params.merge({id: "name"})), {:type => "number"} do |response|
        response.status.should be_success
        response.body.should == {
          :name => "name",
          :type => "double precision",
          :cartodb_type => "number"
        }
      end
    end

    it "Update the type of a given column with an invalid type" do
      put_json api_v1_tables_columns_update_url(params.merge({id: "name"})), {:type => "integerr"} do |response|
        response.status.should == 400
      end
    end

    it "Rename a column" do
      delete_user_data @user
      @table = create_table :user_id => @user.id

      put_json api_v1_tables_columns_update_url(params.merge({id: "name"})), {:new_name => "nombresito"} do |response|
        response.status.should be_success
        response.body.should == {
          :name => "nombresito",
          :type => "text",
          :cartodb_type => "string"
        }
      end
    end

    it "Drop a column" do
      delete_user_data @user
      @table = create_table :user_id => @user.id

      delete_json api_v1_tables_columns_destroy_url(params.merge({id: "name"})) do |response|
        response.status.should eql(204)
      end
    end

  end

end
