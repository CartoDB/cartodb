# encoding: utf-8

require_relative '../../../../app/models/visualization/member'

# TODO:
# - exclude private liked if not shared
# - count shared
# - ...

shared_examples_for "visualization controllers" do

  NORMALIZED_DATE_ATTRIBUTES = %w{ created_at updated_at }

  # Custom hash comparation, since in the ActiveModel-based controllers
  # we allow some differences:
  # - x to many associations can return [] instead of nil
  def normalize_hash(h)
    h.each { |k, v|
      h[k] = nil if v == []
      h[k] = '' if NORMALIZED_DATE_ATTRIBUTES.include?(k)
    }
  end

  def login(user)
    login_as(user, scope: user.subdomain)
  end

  def base_url
    '/api/v1/viz'
  end

  def response_body
    get base_url, nil, @headers
    last_response.status.should == 200
    body = JSON.parse(last_response.body)
    body['visualizations'] = body['visualizations'].map { |v| normalize_hash(v) }
    body
  end

  def factory(user, attributes={})
    {
      name:                     attributes.fetch(:name, "visualization #{rand(9999)}"),
      tags:                     attributes.fetch(:tags, ['foo', 'bar']),
      map_id:                   attributes.fetch(:map_id, ::Map.create(user_id: user.id).id),
      description:              attributes.fetch(:description, 'bogus'),
      type:                     attributes.fetch(:type, 'derived'),
      privacy:                  attributes.fetch(:privacy, 'public'),
      source_visualization_id:  attributes.fetch(:source_visualization_id, nil),
      parent_id:                attributes.fetch(:parent_id, nil),
      locked:                   attributes.fetch(:locked, false),
      prev_id:                  attributes.fetch(:prev_id, nil),
      next_id:                  attributes.fetch(:next_id, nil)
    }
  end

  describe 'index' do
    include_context 'visualization creation helpers'

    before(:each) do
      login(@user1)
    end

    it 'returns success, empty response for empty user' do
      response_body.should == { 'visualizations' => [], 'total_entries' => 0, 'total_user_entries' => 0, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns valid information for a user with one table' do
      table1 = create_random_table(@user1)
      expected_visualization = JSON.parse(table1.table_visualization.to_hash(
        related: false,
        table_data: true,
        user: @user1,
        table: table1,
        synchronization: nil
      ).to_json)
      expected_visualization = normalize_hash(expected_visualization)

      response_body.should == { 'visualizations' => [expected_visualization], 'total_entries' => 1, 'total_user_entries' => 1, 'total_likes' => 0, 'total_shared' => 0}
    end

    it 'returns liked count' do
      table1 = create_random_table(@user1)
      table1b = create_random_table(@user1)
      table2 = create_random_table(@user2)
      table2b = create_random_table(@user2)
      visualization2 = table2.table_visualization
      visualization2.privacy = Visualization::Member::PRIVACY_PUBLIC
      visualization2.store
      visualization2.add_like_from(@user1.id)

      response_body['total_likes'].should == 1
    end

  end

  describe 'main behaviour' do
    # INFO: this tests come from spec/requests/api/visualizations_spec.rb

    before(:all) do
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      @user = create_user(
        username: 'test',
        email:    'client@example.com',
        password: 'clientex',
        private_tables_enabled: true
      )
      @api_key = @user.api_key
    end

    before(:each) do
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      @db = Rails::Sequel.connection
      Sequel.extension(:pagination)

      CartoDB::Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
      CartoDB::Overlay.repository       = DataRepository::Backend::Sequel.new(@db, :overlays)

      begin
        delete_user_data @user
      rescue => exception
        # Silence named maps problems only here upon data cleaning, not in specs
        raise unless exception.class.to_s == 'CartoDB::NamedMapsWrapper::HTTPResponseError'
      end

      @headers = {
        'CONTENT_TYPE'  => 'application/json',
        'HTTP_HOST'     => 'test.localhost.lan'
      }
    end

    after(:all) do
      @user.destroy if @user
    end

    it 'tests exclude_shared and only_shared filters' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      user_1 = create_user(
        username: "test#{rand(9999)}-1",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      user_2 = create_user(
        username: "test#{rand(9999)}-2",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      organization = Organization.new
      organization.name = "org#{rand(9999)}"
      organization.quota_in_bytes = 1234567890
      organization.seats = 5
      organization.save
      organization.valid?.should eq true

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table#{rand(9999)}_1", user_id: user_1.id)
      u1_t_1_id = table.table_visualization.id
      u1_t_1_perm_id = table.table_visualization.permission.id

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table#{rand(9999)}_2", user_id: user_2.id)
      u2_t_1_id = table.table_visualization.id

      post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
           factory(user_1).to_json, @headers
      last_response.status.should == 200
      u1_vis_1_id = JSON.parse(last_response.body).fetch('id')
      u1_vis_1_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory(user_2).to_json, @headers
      last_response.status.should == 200
      u2_vis_1_id = JSON.parse(last_response.body).fetch('id')

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u2_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u2_vis_1_id

      # Share u1 vis with u2
      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_vis_1_perm_id),
          {acl: [{
            type: CartoDB::Permission::TYPE_USER,
            entity: {
              id:   user_2.id,
            },
            access: CartoDB::Permission::ACCESS_READONLY
          }]}.to_json, @headers
      last_response.status.should == 200

      # Vis listing checks
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      # Permissions don't change updated_at
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          exclude_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          only_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          exclude_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          only_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      # Same with 'shared' filter (convenience alias for not handling both exclude_shared and only_shared)
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_NO), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_ONLY), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      # Share u1 table with u2
      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_t_1_perm_id),
          {acl: [{
                   type: CartoDB::Permission::TYPE_USER,
                   entity: {
                     id:   user_2.id,
                   },
                   access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers
      last_response.status.should == 200

      # Dunno why (rack test error?) but this call seems to cache previous params, so just call it to "flush" them
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          shared: 'wadus',
          exclude_shared: false,
          only_shared: false),
          @headers
      # -------------

      # Table listing checks
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          exclude_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          only_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          exclude_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          only_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_t_1_id
    end

    describe 'tests visualization likes endpoints' do
      # TODO: currently new endpoint doesn't match this endpoint

      it 'tests like endpoints' do
        CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

        user_2 = create_user(
          username: 'test2',
          email:    'client2@example.com',
          password: 'clientex'
        )

        post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
          factory(@user).to_json, @headers
        vis_1_id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_likes_count_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 0

        get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        JSON.parse(last_response.body).fetch('likes').should eq []

        get api_v1_visualizations_is_liked_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)

        post api_v1_visualizations_add_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        get api_v1_visualizations_is_liked_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        JSON.parse(last_response.body).fetch('liked').should eq true

        get api_v1_visualizations_likes_count_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        JSON.parse(last_response.body).fetch('likes').should eq [{'actor_id' => @user.id}]

        post api_v1_visualizations_add_like_url(user_domain: user_2.username, id: vis_1_id, api_key: user_2.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 2

        get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        # Careful with order of array items
        (JSON.parse(last_response.body).fetch('likes') - [
                                                           {'actor_id' => @user.id},
                                                           {'actor_id' => user_2.id}
                                                         ]).should eq []

        delete api_v1_visualizations_remove_like_url(user_domain: user_2.username, id: vis_1_id, api_key: user_2.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        # No effect expected
        delete api_v1_visualizations_remove_like_url(user_domain: user_2.username, id: vis_1_id, api_key: user_2.api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        post api_v1_visualizations_add_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        last_response.status.should == 400
        last_response.body.should eq "You've already liked this visualization"

        delete api_v1_visualizations_remove_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 0

        post api_v1_visualizations_add_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        last_response.status.should == 200
        JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

        get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
        JSON.parse(last_response.body).fetch('likes').should eq [{'actor_id' => @user.id}]

        user_2.destroy
      end

      it 'tests totals calculations' do
        CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

        user_1 = create_user(
            username: "test#{rand(9999)}-1",
            email: "client#{rand(9999)}@cartodb.com",
            password: 'clientex',
            private_tables_enabled: false
        )

        user_2 = create_user(
            username: "test#{rand(9999)}-2",
            email: "client#{rand(9999)}@cartodb.com",
            password: 'clientex',
            private_tables_enabled: false
        )

        organization = Organization.new
        organization.name = "org#{rand(9999)}"
        organization.quota_in_bytes = 1234567890
        organization.seats = 5
        organization.save
        organization.valid?.should eq true

        user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
        user_org.promote_user_to_admin
        organization.reload
        user_1.reload

        user_2.organization_id = organization.id
        user_2.save.reload
        organization.reload

        # user 1 will have 1 table and 1 vis
        # user 2 will have 2 of each
        # user 2 will share 1 table and 1 vis with the org
        # user 2 will share the other table and other vis with user 1

        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table_#{rand(9999)}_1_1", user_id: user_1.id)
        u1_t_1_id = table.table_visualization.id

        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table_#{rand(9999)}_2_2", user_id: user_2.id)
        u2_t_1_id = table.table_visualization.id
        u2_t_1_perm_id = table.table_visualization.permission.id

        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table_#{rand(9999)}_2_2", user_id: user_2.id)
        u2_t_2_id = table.table_visualization.id
        u2_t_2_perm_id = table.table_visualization.permission.id

        post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
             factory(user_1).to_json, @headers
        last_response.status.should == 200
        u1_vis_1_id = JSON.parse(last_response.body).fetch('id')

        post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        u2_vis_1_id = JSON.parse(last_response.body).fetch('id')
        u2_vis_1_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

        post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        u2_vis_2_id = JSON.parse(last_response.body).fetch('id')
        u2_vis_2_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 1
        body['total_likes'].should eq 0
        body['total_shared'].should eq 0
        vis = body['visualizations'].first
        vis['id'].should eq u1_t_1_id

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 1
        body['total_likes'].should eq 0
        body['total_shared'].should eq 0
        vis = body['visualizations'].first
        vis['id'].should eq u1_vis_1_id

        # Share u2 vis1 with organization
        put api_v1_permissions_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: u2_vis_1_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_ORGANIZATION,
                       entity: {
                           id:   organization.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 2
        body['total_likes'].should eq 0
        body['total_shared'].should eq 1

        # Share u2 vis2 with u1
        put api_v1_permissions_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: u2_vis_2_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_USER,
                       entity: {
                           id:   user_1.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 0
        body['total_shared'].should eq 2

        post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2

        # Multiple likes to same vis shouldn't increment total as is per vis
        post api_v1_visualizations_add_like_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2


        # Share u2 table1 with org
        put api_v1_permissions_update_url(user_domain:user_2.username, api_key: user_2.api_key, id: u2_t_1_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_ORGANIZATION,
                       entity: {
                           id:   organization.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 2
        body['total_likes'].should eq 0
        body['total_shared'].should eq 1

        # Share u2 table2 with org
        put api_v1_permissions_update_url(user_domain:user_2.username, api_key: user_2.api_key, id: u2_t_2_perm_id),
            {acl: [{
                       type: CartoDB::Permission::TYPE_USER,
                       entity: {
                           id:   user_1.id,
                       },
                       access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 0
        body['total_shared'].should eq 2

        post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_t_1_id, api_key: user_1.api_key)

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2

        # Multiple likes to same table shouldn't increment total as is per vis
        post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_t_1_id, api_key: user_2.api_key)

        get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 3
        body['total_likes'].should eq 1
        body['total_shared'].should eq 2
      end

    end

  end

end
