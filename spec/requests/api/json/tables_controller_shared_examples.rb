# encoding: utf-8

shared_examples_for "tables controllers" do

  describe '#show legacy tests' do

    before(:all) do
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex", :private_tables_enabled => true)
      host! 'test.localhost.lan'
    end

    let(:params) { { :api_key => @user.api_key } }

    it 'returns table attributes' do
      table = create_table(
        user_id:      @user.id,
        name:         'My table #1',
        privacy:      UserTable::PRIVACY_PRIVATE,
        tags:         "tag 1, tag 2,tag 3, tag 3",
        description:  'Testing is awesome'
      )

      get_json api_v1_tables_show_url(params.merge(id: table.id)) do |response|
        response.status.should == 200
        response.body.fetch(:name).should == 'my_table_1'
        response.body.fetch(:description).should == 'Testing is awesome'
      end
    end


    it "downloads table metadata" do
      data_import = DataImport.create(
                                      user_id: @user.id,
                                      data_source: '/../spec/support/data/TM_WORLD_BORDERS_SIMPL-0.3.zip'
                                      ).run_import!

      get_json api_v1_tables_show_url(params.merge(id: data_import.table_id)) do |response|
        response.status.should be_success
        response.body.should include(
                                     name: "tm_world_borders_simpl_0_3",
                                     privacy: "PRIVATE",
                                     schema: [["cartodb_id", "number"], ["the_geom", "geometry", "geometry", "multipolygon"], ["area", "number"], ["fips", "string"], ["iso2", "string"], ["iso3", "string"], ["lat", "number"], ["lon", "number"], ["name", "string"], ["pop2005", "number"], ["region", "number"], ["subregion", "number"], ["un", "number"], ["created_at", "date"], ["updated_at", "date"]],
                                     rows_counted: 246,
                                     description: nil,
                                     geometry_types: ["ST_MultiPolygon"]
                                     )
      end
    end

  end

end
