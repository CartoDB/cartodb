# Contains specs that both vizjson2 and 3 must verify.
# Specs including this should define api_vx_visualizations_vizjson_url as an alias for the desired URL generator.
# Example:
#  it_behaves_like 'vizjson generator' do
#    def api_vx_visualizations_vizjson_url(options)
#      api_v2_visualizations_vizjson_url(options)
#    end
#  end
shared_examples_for 'vizjson generator' do
  describe 'vizjson2 compatibility' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    TEST_UUID = '00000000-0000-0000-0000-000000000000'.freeze

    before(:all) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      @user_1 = FactoryGirl.create(:valid_user, private_tables_enabled: false)
      @api_key = @user_1.api_key
      @user_2 = FactoryGirl.create(:valid_user)

      @headers = { 'CONTENT_TYPE'  => 'application/json' }
      host! "#{@user_1.subdomain}.localhost.lan"
    end

    after(:all) do
      @user_1.destroy
      @user_2.destroy
    end

    it 'returns 404 for non existing visualizations' do
      get api_vx_visualizations_vizjson_url(id: TEST_UUID, api_key: @api_key), {}, http_json_headers
      last_response.status.should == 404
    end

    it 'tests privacy of vizjsons' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

      user_1 = create_user(
        username: "test#{rand(9999)}-1",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: true
      )

      user_2 = create_user(
        username: "test#{rand(9999)}-2",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: true
      )

      organization = test_organization.save

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
           factory(user_1).to_json, http_json_headers
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      u1_vis_1_id = body.fetch('id')
      u1_vis_1_perm_id = body.fetch('permission').fetch('id')
      # By default derived vis from private tables are WITH_LINK, so setprivate
      put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
          {
            id: u1_vis_1_id,
            privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
          }.to_json, http_json_headers
      last_response.status.should == 200

      # Share vis with user_2 in readonly (vis can never be shared in readwrite)
      put api_v1_permissions_update_url(user_domain: user_1.username, api_key: user_1.api_key, id: u1_vis_1_perm_id),
          { acl: [{
                   type: CartoDB::Permission::TYPE_USER,
                   entity: { id:   user_2.id },
                   access: CartoDB::Permission::ACCESS_READONLY
                  }] }.to_json, http_json_headers
      last_response.status.should == 200

      # privacy private checks
      # ----------------------

      # Owner, authenticated
      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Other user, has it shared in readonly mode
      get api_vx_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Unauthenticated user
      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user_1.api_key)
      last_response.status.should == 403

      # Unauthenticated user
      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user_1.api_key)
      last_response.status.should == 403

      # Now with link
      # -------------
      put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
          {
            id: u1_vis_1_id,
            privacy: CartoDB::Visualization::Member::PRIVACY_LINK
          }.to_json, http_json_headers
      last_response.status.should == 200

      # Owner authenticated
      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Other user has it shared in readonly mode
      get api_vx_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Unauthenticated user
      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Now public
      # ----------
      put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
          {
            id: u1_vis_1_id,
            privacy: CartoDB::Visualization::Member::PRIVACY_LINK
          }.to_json, http_json_headers
      last_response.status.should == 200

      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Other user has it shared in readonly mode
      get api_vx_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Unauthenticated user
      get api_vx_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Check visualization id under wrong subdomain triggers 404
      get api_vx_visualizations_vizjson_url(user_domain: @user_1.username, id: u1_vis_1_id, api_key: @user_1.api_key)
      last_response.status.should == 404

      # Check visualization id under shared with user subdomain triggers 200
      get api_vx_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
    end

    it 'Sanitizes vizjson callback' do
      valid_callback = 'my_function'
      valid_callback2 = 'a'
      invalid_callback1 = 'alert(1);'
      invalid_callback2 = '%3B'
      invalid_callback3 = '123func' # JS names cannot start by number

      table_attributes  = table_factory
      table_id          = table_attributes.fetch('id')
      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: valid_callback), {}, @headers
      last_response.status.should == 200
      (last_response.body =~ /^#{valid_callback}\(\{/i).should eq 0

      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: invalid_callback1), {}, @headers
      last_response.status.should == 400

      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: invalid_callback2), {}, @headers
      last_response.status.should == 400

      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: invalid_callback3), {}, @headers
      last_response.status.should == 400

      # if param specified, must not be empty
      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: ''), {}, @headers
      last_response.status.should == 400

      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: valid_callback2), {}, @headers
      last_response.status.should == 200
      (last_response.body =~ /^#{valid_callback2}\(\{/i).should eq 0

      get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key), {}, @headers
      last_response.status.should == 200
      (last_response.body =~ /^\{/i).should eq 0
    end

    describe 'GET /api/vx/viz/:id/viz' do
      before(:each) do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user_1)
      end

      it 'renders vizjson vx' do
        table_id = table_factory.fetch('id')
        get api_vx_visualizations_vizjson_url(id: table_id, api_key: @api_key),
          {}, @headers
        last_response.status.should == 200
        ::JSON.parse(last_response.body).keys.length.should > 1
      end

      it 'returns 200 if subdomain is empty' do
        viz = api_visualization_creation(@user_1, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
        # INFO: I couldn't get rid of subdomain, so I stubbed
        CartoDB.stubs(:extract_subdomain).returns('')
        get api_vx_visualizations_vizjson_url(id: viz.id)
        last_response.status.should == 200
      end

      it 'returns 200 if subdomain matches' do
        viz = api_visualization_creation(@user_1, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
        get api_vx_visualizations_vizjson_url(user_domain: @user_1.username, id: viz.id)
        last_response.status.should == 200
      end

      it 'returns 404 if subdomain does not match' do
        viz = api_visualization_creation(@user_1, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
        get api_vx_visualizations_vizjson_url(user_domain: 'whatever', id: viz.id)
        last_response.status.should == 404
      end

      it 'returns children (slides) vizjson' do
        parent = api_visualization_creation(@user_1, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
        child = api_visualization_creation(@user_1, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_SLIDE, parent_id: parent.id })

        get api_vx_visualizations_vizjson_url(id: parent.id, api_key: @api_key), {}, @headers

        last_response.status.should eq 200
        response = JSON.parse(last_response.body)
        slides = response.fetch('slides')
        slides.count.should eq 1
        slide = slides[0]
        slide['id'].should eq child.id
        slide['title'].should eq child.name
        slide['version'].should eq '0.1.0'
      end

      it "comes with proper surrogate-key" do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true)
        table                 = table_factory(privacy: 1)
        source_visualization  = table.fetch('table_visualization')

        payload = { source_visualization_id: source_visualization.fetch('id'), privacy: 'PUBLIC' }

        post api_v1_visualizations_create_url(user_domain: @user_1.username, api_key: @api_key),
             payload.to_json, @headers
        last_response.status.should == 200
        viz_id = JSON.parse(last_response.body).fetch('id')

        put api_v1_visualizations_show_url(user_domain: @user_1.username, id: viz_id, api_key: @api_key),
            { privacy: 'PUBLIC', id: viz_id }.to_json, @headers

        get api_vx_visualizations_vizjson_url(user_domain: @user_1.username, id: viz_id, api_key: @api_key),
            { id: viz_id }, @headers

        last_response.status.should == 200
        last_response.headers.should have_key('Surrogate-Key')
        last_response['Surrogate-Key'].should include(CartoDB::SURROGATE_NAMESPACE_VIZJSON)
        last_response['Surrogate-Key'].should include(get_surrogate_key(CartoDB::SURROGATE_NAMESPACE_VISUALIZATION, viz_id))

        delete api_v1_visualizations_destroy_url(user_domain: @user_1.username, id: viz_id, api_key: @api_key),
               { id: viz_id }.to_json,
               @headers
      end

      it 'joins the attributions of the layers in a layergroup in the viz.json' do
        table1 = table_factory
        table2 = table_factory
        table3 = table_factory

        payload = {
          name: 'new visualization',
          tables: [
            table1.fetch('name'),
            table2.fetch('name'),
            table3.fetch('name')
          ],
          privacy: 'public'
        }

        post api_v1_visualizations_create_url(api_key: @api_key), payload.to_json, @headers
        last_response.status.should == 200

        # Set the attributions of the tables to check that they are included in the viz.json
        table1_visualization = Carto::Visualization.find(table1["table_visualization"]["id"])
        table1_visualization.update_attribute(:attributions, 'attribution1')
        table2_visualization = Carto::Visualization.find(table2["table_visualization"]["id"])
        table2_visualization.update_attribute(:attributions, 'attribution2')
        table3_visualization = Carto::Visualization.find(table3["table_visualization"]["id"])
        table3_visualization.update_attribute(:attributions, '')

        visualization = JSON.parse(last_response.body)

        get api_vx_visualizations_vizjson_url(id: visualization.fetch('id'), api_key: @api_key), {}, @headers

        visualization = JSON.parse(last_response.body)

        # Attribution of the layergroup layer is right
        layer_group_layer = visualization["layers"][1]
        layer_group_layer["type"].should == 'layergroup'

        layer_group_attributions = layer_group_layer["options"]["attribution"].split(',').map(&:strip)
        layer_group_layer.size.should == 2

        layer_group_attributions.should include('attribution1')
        layer_group_attributions.should include('attribution2')
      end

      it 'joins the attributions of the layers in a namedmap in the viz.json' do
        table1 = table_factory
        table2 = table_factory
        table3 = table_factory

        payload = {
          name: 'new visualization',
          tables: [
            table1.fetch('name'),
            table2.fetch('name'),
            table3.fetch('name')
          ],
          privacy: 'private'
        }

        post api_v1_visualizations_create_url(api_key: @api_key), payload.to_json, @headers
        last_response.status.should eq 200

        # Set the attributions of the tables to check that they are included in the viz.json
        table1_visualization = Carto::Visualization.find(table1["table_visualization"]["id"])
        table1_visualization.update_attribute(:attributions, 'attribution1')
        table2_visualization = Carto::Visualization.find(table2["table_visualization"]["id"])
        table2_visualization.update_attribute(:attributions, 'attribution2')
        table3_visualization = Carto::Visualization.find(table3["table_visualization"]["id"])
        table3_visualization.update_attribute(:attributions, '')

        visualization = JSON.parse(last_response.body)

        # Update the privacy of the visualization so that the viz_json generates a named_map
        Carto::Api::VisualizationVizJSONAdapter.any_instance.stubs('retrieve_named_map?' => true)

        get api_vx_visualizations_vizjson_url(id: visualization.fetch('id'), api_key: @api_key), {}, @headers

        visualization = JSON.parse(last_response.body)

        # Attribution of the layergroup layer is right
        named_map_layer = visualization["layers"][1]
        named_map_layer["type"].should == 'namedmap'

        named_map_attributions = named_map_layer["options"]["attribution"].split(',').map(&:strip)

        named_map_attributions.size.should == 2
        named_map_attributions.should include('attribution1')
        named_map_attributions.should include('attribution2')
      end

      it "Updates viz.json's layergroup when attributions in a related layer change" do
        table_1_attribution = 'attribution 1'
        modified_table_2_attribution = 'modified attribution 2'

        table1 = table_factory
        table2 = table_factory

        payload = {
          name: 'new visualization',
          tables: [
            table1.fetch('name'),
            table2.fetch('name')
          ],
          privacy: 'public'
        }

        post api_v1_visualizations_create_url(api_key: @api_key), payload.to_json, @headers
        last_response.status.should == 200
        visualization = JSON.parse(last_response.body)

        table1_visualization = Carto::Visualization.find(table1["table_visualization"]["id"])
        table1_visualization.update_attribute(:attributions, table_1_attribution)
        table2_visualization = Carto::Visualization.find(table2["table_visualization"]["id"])
        table2_visualization.update_attribute(:attributions, 'attribution 2')

        # Call to cache the vizjson after generating it
        get api_vx_visualizations_vizjson_url(id: visualization.fetch('id'), api_key: @api_key),
            { id: visualization.fetch('id') },
            @headers

        # Now force a change
        put api_v1_visualizations_update_url(api_key: @api_key, id: table2_visualization.id),
            { attributions: modified_table_2_attribution, id: table2_visualization.id }.to_json,
            @headers
        last_response.status.should == 200

        get api_vx_visualizations_vizjson_url(id: visualization.fetch('id'), api_key: @api_key),
            { id: visualization.fetch('id') },
            @headers
        visualization = JSON.parse(last_response.body)

        layer_group_layer = visualization["layers"][1]
        layer_group_layer["type"].should == 'layergroup'
        layer_group_attributions = layer_group_layer["options"]["attribution"].split(',').map(&:strip)
        layer_group_layer.size.should == 2

        layer_group_attributions.should include(table_1_attribution)
        layer_group_attributions.should include(modified_table_2_attribution)
      end

    end
  end
end
