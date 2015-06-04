# encoding: utf-8

require_relative '../../../../app/models/visualization/member'

shared_examples_for "visualization controllers" do
  include CacheHelper

  TEST_UUID = '00000000-0000-0000-0000-000000000000'

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
    host! "#{user.subdomain}.localhost.lan"
  end

  def base_url
    '/api/v1/viz'
  end

  def response_body(params=nil)
    get base_url, params, @headers
    last_response.status.should == 200
    body = JSON.parse(last_response.body)
    body['visualizations'] = body['visualizations'].map { |v| normalize_hash(v) }
    body
  end

  def factory(user, attributes={})
    visualization_template(user, attributes)
  end

  def table_factory(options={})
    privacy = options.fetch(:privacy, 1)

    seed    = rand(9999)
    payload = {
      name:         "table #{seed}",
      description:  "table #{seed} description"
    }
    post api_v1_tables_create_url(api_key: @api_key),
      payload.to_json, @headers

    table_attributes  = JSON.parse(last_response.body)
    table_id          = table_attributes.fetch('id')

    put api_v1_tables_update_url(id: table_id, api_key: @api_key),
      { privacy: privacy }.to_json, @headers

    table_attributes
  end

  def api_visualization_creation(user, headers, additional_fields = {})
    post api_v1_visualizations_create_url(user_domain: user.username, api_key: user.api_key), factory(user).merge(additional_fields).to_json, headers
    id = JSON.parse(last_response.body).fetch('id')
    CartoDB::Visualization::Member.new(id: id).fetch
  end

  def test_organization
    organization = Organization.new
    organization.name = org_name = "org#{rand(9999)}"
    organization.quota_in_bytes = 1234567890
    organization.seats = 5
    organization
  end

  describe 'index' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      login(@user1)
      @headers = {'CONTENT_TYPE'  => 'application/json'}
      host! "#{@user1.subdomain}.localhost.lan"
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

      response_body(type: CartoDB::Visualization::Member::TYPE_CANONICAL).should == { 'visualizations' => [expected_visualization], 'total_entries' => 1, 'total_user_entries' => 1, 'total_likes' => 0, 'total_shared' => 0}
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

      response_body(type: CartoDB::Visualization::Member::TYPE_CANONICAL)['total_likes'].should == 1
    end

    it 'does a partial match search' do
      create_random_table(@user1, "foo")
      create_random_table(@user1, "bar")
      create_random_table(@user1, "foo_patata_bar")
      create_random_table(@user1, "foo_patata_baz")

      #body = response_body("#{BASE_URL}/?q=patata")['total_entries'].should == 2
      body = response_body(q: 'patata', type: CartoDB::Visualization::Member::TYPE_CANONICAL)
      body['total_entries'].should == 2
      body['total_user_entries'].should == 4
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
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
      
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
      }
      host! 'test.localhost.lan'
    end

    after(:all) do
      @user.destroy if @user
    end

    it 'tests exclude_shared and only_shared filters' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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

      organization = test_organization.save

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
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

        user_2 = create_user(
            username: "test#{rand(9999)}-2",
            email: "client#{rand(9999)}@cartodb.com",
            password: 'clientex',
        )

        vis_1_id = create_visualization(@user).id

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
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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

        organization = test_organization.save

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
        u2_t_2 = table
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
        post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)

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
        body['visualizations'][0]['table']['name'].should == "public.#{u2_t_2.name}"

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

    describe 'index endpoint' do

      it 'tests normal users authenticated and unauthenticated calls' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

        user_2 = create_user(
          username: 'testindexauth',
          email:    'test_auth@example.com',
          password: 'testauth',
          private_maps_enabled: true
        )

        collection = CartoDB::Visualization::Collection.new.fetch(user_id: user_2.id)
        collection.map(&:delete)

        post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        pub_vis_id = JSON.parse(last_response.body).fetch('id')

        put api_v1_visualizations_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: pub_vis_id),
             {
               privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
             }.to_json, @headers
        last_response.status.should == 200

        post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        priv_vis_id = JSON.parse(last_response.body).fetch('id')

        put api_v1_visualizations_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: priv_vis_id),
             {
               privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
             }.to_json, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(user_domain: user_2.username, type: 'derived'), @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 1
        vis = body['visualizations'].first
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase

        get api_v1_visualizations_index_url(user_domain: user_2.username, type: 'derived', api_key: user_2.api_key,
                                            order: 'updated_at'),
          {}, @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 2
        vis = body['visualizations'][0]
        vis['id'].should eq priv_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE.upcase
        vis = body['visualizations'][1]
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase
      end

      it 'tests organization users authenticated and unauthenticated calls' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

        organization = test_organization.save

        user_2 = create_user(
          username: "test#{rand(9999)}",
          email:    "client#{rand(9999)}@cartodb.com",
          password: 'clientex'
        )

        user_org = CartoDB::UserOrganization.new(organization.id, user_2.id)
        user_org.promote_user_to_admin
        organization.reload
        user_2.reload

        post "http://#{organization.name}.cartodb.test#{api_v1_visualizations_create_path(user_domain: user_2.username,
                                                                                 api_key: user_2.api_key)}",
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        pub_vis_id = JSON.parse(last_response.body).fetch('id')

        put "http://#{organization.name}.cartodb.test#{api_v1_visualizations_update_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key,
                                                                               id: pub_vis_id)}",
            {
              privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
            }.to_json, @headers
        last_response.status.should == 200

        post "http://#{organization.name}.cartodb.test#{api_v1_visualizations_create_path(user_domain: user_2.username,
                                                                                api_key: user_2.api_key)}",
             factory(user_2).to_json, @headers
        last_response.status.should == 200
        priv_vis_id = JSON.parse(last_response.body).fetch('id')

        put "http://#{organization.name}.cartodb.test#{api_v1_visualizations_update_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key,
                                                                               id: priv_vis_id)}",
            {
              privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
            }.to_json, @headers
        last_response.status.should == 200

        get "http://#{organization.name}.cartodb.test#{api_v1_visualizations_index_path(user_domain: user_2.username,
                                                                               type: 'derived')}", @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 1
        vis = body['visualizations'].first
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase


        get "http://#{organization.name}.cartodb.test#{api_v1_visualizations_index_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key,
                                                                               type: 'derived',
                                                                               order: 'updated_at')}", {}, @headers
        body = JSON.parse(last_response.body)

        body['total_entries'].should eq 2
        vis = body['visualizations'][0]
        vis['id'].should eq priv_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE.upcase
        vis = body['visualizations'][1]
        vis['id'].should eq pub_vis_id
        vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase

        user_2.destroy
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
             factory(user_1).to_json, @headers
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        u1_vis_1_id = body.fetch('id')
        u1_vis_1_perm_id = body.fetch('permission').fetch('id')
        # By default derived vis from private tables are WITH_LINK, so setprivate
        put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
            { privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE }.to_json, @headers
        last_response.status.should == 200

        # Share vis with user_2 in readonly (vis can never be shared in readwrite)
        put api_v1_permissions_update_url(user_domain: user_1.username, api_key: user_1.api_key, id: u1_vis_1_perm_id),
            {acl: [{
                     type: CartoDB::Permission::TYPE_USER,
                     entity: {
                       id:   user_2.id,
                     },
                     access: CartoDB::Permission::ACCESS_READONLY
                   }]}.to_json, @headers
        last_response.status.should == 200

        # privacy private checks
        # ----------------------

        # Owner, authenticated
        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Other user, has it shared in readonly mode
        get api_v2_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Unauthenticated user
        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
        last_response.status.should == 403

        # Unauthenticated user
        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
        last_response.status.should == 403

        # Now with link
        # -------------
        put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
            { privacy: CartoDB::Visualization::Member::PRIVACY_LINK }.to_json, @headers
        last_response.status.should == 200

        # Owner authenticated
        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Other user has it shared in readonly mode
        get api_v2_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Unauthenticated user
        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Now public
        # ----------
        put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
            { privacy: CartoDB::Visualization::Member::PRIVACY_LINK }.to_json, @headers
        last_response.status.should == 200

        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Other user has it shared in readonly mode
        get api_v2_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

        # Unauthenticated user
        get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
        last_response.status.should == 200
        body = JSON.parse(last_response.body)
        body['id'].should eq u1_vis_1_id

      end

      it 'Sanitizes vizjson callback' do
        valid_callback = 'my_function'
        valid_callback2 = 'a'
        invalid_callback1 = 'alert(1);'
        invalid_callback2 = '%3B'
        invalid_callback3 = '123func'    # JS names cannot start by number

        table_attributes  = table_factory
        table_id          = table_attributes.fetch('id')
        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: valid_callback), {}, @headers
        last_response.status.should == 200
        (last_response.body =~ /^#{valid_callback}\(\{/i).should eq 0

        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: invalid_callback1), {}, @headers
        last_response.status.should == 400

        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: invalid_callback2), {}, @headers
        last_response.status.should == 400

        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: invalid_callback3), {}, @headers
        last_response.status.should == 400

        # if param specified, must not be empty
        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: ''), {}, @headers
        last_response.status.should == 400

        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key, callback: valid_callback2), {}, @headers
        last_response.status.should == 200
        (last_response.body =~ /^#{valid_callback2}\(\{/i).should eq 0

        get api_v2_visualizations_vizjson_url(id: table_id, api_key: @api_key), {}, @headers
        last_response.status.should == 200
        (last_response.body =~ /^\{/i).should eq 0
      end

    end

    describe 'GET /api/v1/viz' do
      before(:each) do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user)
      end

      it 'retrieves a collection of visualizations' do
        payload = factory(@user)
        post api_v1_visualizations_create_url(api_key: @api_key), payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.first.fetch('id').should == id
      end

      it 'is updated after creating a visualization' do
        payload = factory(@user)
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.size.should == 1

        payload = factory(@user).merge('name' => 'another one')
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.size.should == 2
      end

      it 'is updated after deleting a visualization' do
        payload = factory(@user)
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.should_not be_empty

        delete api_v1_visualizations_destroy_url(id: id, api_key: @api_key),
          {}, @headers
        get api_v1_visualizations_index_url(api_key: @api_key),
          {}, @headers

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.should be_empty
      end

      it 'paginates results' do
        per_page      = 10
        total_entries = 20

        total_entries.times do
          post api_v1_visualizations_index_url(api_key: @api_key),
            factory(@user).to_json, @headers
        end

        get api_v1_visualizations_index_url(api_key: @api_key, page: 1, per_page: per_page), {}, @headers

        last_response.status.should == 200

        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should == per_page
        response.fetch('total_entries').should == total_entries
      end

      it 'returns filtered results' do
        post api_v1_visualizations_create_url(api_key: @api_key),
          factory(@user).to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'table'),
          {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.should be_empty

        post api_v1_visualizations_create_url(api_key: @api_key),
          factory(@user).to_json, @headers
        post api_v1_visualizations_create_url(api_key: @api_key),
          factory(@user).merge(type: 'table').to_json, @headers
        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived'),
          {}, @headers

        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.size.should == 2
      end

      it 'creates a visualization from a list of tables' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
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

        post api_v1_visualizations_create_url(api_key: @api_key),
              payload.to_json, @headers
        last_response.status.should == 200

        visualization = JSON.parse(last_response.body)

        # TODO: this endpoint doesn't exist now. Current replacement?
        #get "/api/v1/viz/#{visualization.fetch('id')}/viz?api_key=#{@api_key}",
        #  {}, @headers
        #last_response.status.should == 403

        get api_v2_visualizations_vizjson_url(id: visualization.fetch('id'), api_key: @api_key),
          {}, @headers
        last_response.status.should == 200

        # include overlays

        get api_v1_visualizations_overlays_index_url(visualization_id: visualization.fetch('id'), api_key: @api_key),
          {}, @headers
        last_response.status.should == 200
        overlays = JSON.parse(last_response.body)
        overlays.length.should == 5
      end

    end

    describe 'GET /api/v1/viz/:id' do

      before(:each) do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user)
      end

      it 'returns a visualization' do
        payload = factory(@user)
        post api_v1_visualizations_create_url(api_key: @api_key),
          payload.to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_show_url(id: id, api_key: @api_key), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)

        response.fetch('id')              .should_not be_nil
        response.fetch('map_id')          .should_not be_nil
        response.fetch('tags')            .should_not be_empty
        response.fetch('description')     .should_not be_nil
        response.fetch('related_tables')  .should_not be_nil
      end

    end

    describe 'GET /api/v2/viz/:id/viz' do
      before(:each) do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user)
      end

      it 'renders vizjson v2' do
        table_attributes  = table_factory
        table_id          = table_attributes.fetch('id')
        get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}",
          {}, @headers
        last_response.status.should == 200
        ::JSON.parse(last_response.body).keys.length.should > 1
      end

      it 'returns children (slides) vizjson' do
        parent = api_visualization_creation(@user, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
        child = api_visualization_creation(@user, @headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_SLIDE, parent_id: parent.id })

        get "/api/v2/viz/#{parent.id}/viz?api_key=#{@api_key}", {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        slides = response.fetch('slides')
        slides.count.should == 1
      end

      it "comes with proper surrogate-key" do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
        table                 = table_factory(privacy: 1)
        source_visualization  = table.fetch('table_visualization')


        payload = { source_visualization_id: source_visualization.fetch('id'), privacy: 'PUBLIC' }

        post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
             payload.to_json, @headers

        viz_id = JSON.parse(last_response.body).fetch('id')

        put api_v1_visualizations_show_url(user_domain: @user.username, id: viz_id, api_key: @api_key),
            { privacy: 'PUBLIC' }.to_json, @headers

        get api_v2_visualizations_vizjson_url(user_domain: @user.username, id: viz_id, api_key: @api_key),
            {}, @headers

        last_response.status.should == 200
        last_response.headers.should have_key('Surrogate-Key')
        last_response['Surrogate-Key'].should include(CartoDB::SURROGATE_NAMESPACE_VIZJSON)
        last_response['Surrogate-Key'].should include(get_surrogate_key(CartoDB::SURROGATE_NAMESPACE_VISUALIZATION, viz_id))

        delete api_v1_visualizations_show_url(user_domain: @user.username, id: viz_id, api_key: @api_key),
               { }, @headers
      end
    end

    describe 'tests visualization listing filters' do
      before(:each) do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
        delete_user_data(@user)
      end

      it 'uses locked filter' do
        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user, locked: true).to_json, @headers
        vis_1_id = JSON.parse(last_response.body).fetch('id')
        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user, locked: false).to_json, @headers
        vis_2_id = JSON.parse(last_response.body).fetch('id')

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived'), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 2

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived', locked: true), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 1
        collection.first.fetch('id').should eq vis_1_id

        get api_v1_visualizations_index_url(api_key: @api_key, type: 'derived', locked: false), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 1
        collection.first.fetch('id').should eq vis_2_id
      end

      it 'searches by tag' do
        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user, locked: true, tags: ['test1']).to_json, @headers
        vis_1_id = JSON.parse(last_response.body).fetch('id')
        post api_v1_visualizations_create_url(api_key: @api_key), factory(@user, locked: false, tags: ['test2']).to_json, @headers

        get api_v1_visualizations_index_url(api_key: @api_key, tags: 'test1'), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 1
        collection.first['id'].should == vis_1_id
      end

    end

    describe 'non existent visualization' do
      it 'returns 404' do
        get api_v1_visualizations_show_url(id: TEST_UUID, api_key: @api_key), {}, @headers
        last_response.status.should == 404

        put api_v1_visualizations_update_url(id: TEST_UUID, api_key: @api_key), {}, @headers
        last_response.status.should == 404

        delete api_v1_visualizations_destroy_url(id: TEST_UUID, api_key: @api_key), {}, @headers
        last_response.status.should == 404

        get "/api/v2/viz/#{TEST_UUID}/viz?api_key=#{@api_key}", {}, @headers
        last_response.status.should == 404
      end
    end

    describe '/api/v1/viz/:id/watching' do

      before(:all) do
        @user_1 = create_test_user
        @user_2 = create_test_user

        organization = test_organization.save

        user_org = CartoDB::UserOrganization.new(organization.id, @user_1.id)
        user_org.promote_user_to_admin
        @user_1.reload

        @user_2.organization_id = organization.id
        @user_2.save.reload
      end

      it 'returns an empty array if no other user is watching' do
        CartoDB::Visualization::Watcher.any_instance.stubs(:list).returns([])

        CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

        login(@user_1)
        post api_v1_visualizations_create_url(api_key: @user_1.api_key), factory(@user_1, locked: true).to_json, @headers
        id = JSON.parse(last_response.body).fetch('id')

        login(@user_1)
        get api_v1_visualizations_notify_watching_url(id: id, api_key: @user_1.api_key)
        body = JSON.parse(last_response.body)
        body.should == []
      end
    end

  end

end
