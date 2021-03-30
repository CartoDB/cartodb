require_relative '../spec_helper'
require 'helpers/user_part_helper'

describe User do
  include UserPartHelper
  include_context 'user spec configuration'

  describe 'central synchronization' do
    it 'should create remote user in central if needed' do
      pending 'Missing Message Broker config' unless Cartodb::Central.message_broker_sync_enabled?

      organization = create_org('testorg', 500.megabytes, 1)
      user = create_user email: 'user1@testorg.com',
                         username: 'user1',
                         password: 'user11',
                         account_type: 'ORGANIZATION USER'
      user.organization = organization
      user.save
      Cartodb::Central.any_instance.expects(:create_organization_user).with(organization.name, user.allowed_attributes_to_central(:create)).once
      user.create_in_central.should be_true
      organization.destroy
    end
  end

  it "should have many tables" do
    @user2.tables.should be_empty
    create_table :user_id => @user2.id, :name => 'My first table', :privacy => UserTable::PRIVACY_PUBLIC
    @user2.reload
    @user2.tables.all.should == [UserTable.first(:user_id => @user2.id)]
  end

  describe '#shared_tables' do
    it 'Checks that shared tables include not only owned ones' do
      require_relative '../../app/models/visualization/collection'
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      bypass_named_maps
      # No need to really touch the DB for the permissions
      Table::any_instance.stubs(:add_read_permission).returns(nil)

      # We're leaking tables from some tests, make sure there are no tables
      @user.tables.all.each { |t| t.destroy }
      @user2.tables.all.each { |t| t.destroy }

      table = Table.new
      table.user_id = @user.id
      table.save.reload
      table2 = Table.new
      table2.user_id = @user.id
      table2.save.reload

      table3 = Table.new
      table3.user_id = @user2.id
      table3.name = 'sharedtable'
      table3.save.reload

      table4 = Table.new
      table4.user_id = @user2.id
      table4.name = 'table4'
      table4.save.reload

      # Only owned tables
      user_tables = tables_including_shared(@user)
      user_tables.count.should eq 2

      # Grant permission
      user2_vis  = CartoDB::Visualization::Collection.new.fetch(user_id: @user2.id, name: table3.name).first
      permission = user2_vis.permission
      permission.acl = [
        {
          type: Carto::Permission::TYPE_USER,
          entity: {
            id: @user.id,
            username: @user.username
          },
          access: Carto::Permission::ACCESS_READONLY
        }
      ]
      permission.save

      # Now owned + shared...
      user_tables = tables_including_shared(@user)
      user_tables.count.should eq 3

      contains_shared_table = false
      user_tables.each{ |item|
        contains_shared_table ||= item.id == table3.id
      }
      contains_shared_table.should eq true

      contains_shared_table = false
      user_tables.each{ |item|
        contains_shared_table ||= item.id == table4.id
      }
      contains_shared_table.should eq false

      @user.tables.all.each { |t| t.destroy }
      @user2.tables.all.each { |t| t.destroy }
    end
  end

  it "should create a client_application for each user" do
    @user.client_application.should_not be_nil
  end

  it "should reset its client application" do
    old_key = @user.client_application.key

    @user.reset_client_application!
    @user.reload

    @user.client_application.key.should_not == old_key
  end

  it "should not regenerate the api_key after saving" do
    expect { @user.save }.to_not change { @user.api_key }
  end

  it "should remove its user tables, layers and data imports after deletion" do
    doomed_user = create_user(email: 'doomed2@example.com', username: 'doomed2', password: 'doomed123')
    data_import = DataImport.create(user_id: doomed_user.id, data_source: fake_data_path('clubbing.csv')).run_import!
    doomed_user.add_layer Layer.create(kind: 'carto')
    table_id = data_import.table_id
    uuid = UserTable.where(id: table_id).first.table_visualization.id

    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{doomed_user.database_name}.*")
      .at_least(1)
      .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
      .with(".*#{uuid}:vizjson")
      .at_least_once
      .returns(true)

    doomed_user.destroy

    DataImport.where(user_id: doomed_user.id).count.should == 0
    UserTable.where(user_id: doomed_user.id).count.should == 0
    Layer.db["SELECT * from layers_users WHERE user_id = '#{doomed_user.id}'"].count.should == 0
  end

  describe '#destroy' do
    it 'deletes database role' do
      u1 = create_user(email: 'ddr@example.com', username: 'ddr', password: 'admin123')
      role = u1.database_username
      db = u1.in_database
      db_service = u1.db_service

      db_service.role_exists?(db, role).should == true

      u1.destroy

      expect do
        db_service.role_exists?(db, role).should == false
      end.to raise_error(/role "#{role}" does not exist/)
      db.disconnect
    end

    it 'deletes api keys' do
      user = create_user(email: 'ddr@example.com', username: 'ddr', password: 'admin123')
      api_key = create(:api_key_apis, user_id: user.id)

      user.destroy
      expect(Carto::ApiKey.exists?(api_key.id)).to be_false
      expect($users_metadata.exists(api_key.send(:redis_key))).to be_false
    end

    describe "on organizations" do
      include_context 'organization with users helper'

      it 'deletes database role' do
        role = @org_user_1.database_username
        db = @org_user_1.in_database
        db_service = @org_user_1.db_service

        db_service.role_exists?(db, role).should == true

        @org_user_1.destroy

        expect do
          db_service.role_exists?(db, role).should == false
        end.to raise_error(/role "#{role}" does not exist/)
        db.disconnect
      end

      it 'deletes temporary analysis tables' do
        db = @org_user_2.in_database
        db.run('CREATE TABLE analysis_cd60938c7b_2ad1345b134ed3cd363c6de651283be9bd65094e (a int)')
        db.run(%{INSERT INTO cdb_analysis_catalog (username, cache_tables, node_id, analysis_def)
                 VALUES ('#{@org_user_2.username}', '{analysis_cd60938c7b_2ad1345b134ed3cd363c6de651283be9bd65094e}', 'a0', '{}')})
        @org_user_2.destroy

        db = @org_user_owner.in_database
        db["SELECT COUNT(*) FROM cdb_analysis_catalog WHERE username='#{@org_user_2.username}'"].first[:count].should eq 0
      end

      describe 'User#destroy' do
        it 'blocks deletion with shared entities' do
          @not_to_be_deleted = TestUserFactory.new.create_test_user(unique_name('user'), @organization)
          table = create_random_table(@not_to_be_deleted)
          share_table_with_user(table, @org_user_owner)

          expect { @not_to_be_deleted.destroy }.to raise_error(/Cannot delete user, has shared entities/)

          ::User[@not_to_be_deleted.id].should be
        end

        it 'deletes api keys and associated roles' do
          user = TestUserFactory.new.create_test_user(unique_name('user'), @organization)
          api_key = create(:api_key_apis, user_id: user.id)

          user.destroy
          expect(Carto::ApiKey.exists?(api_key.id)).to be_false
          expect($users_metadata.exists(api_key.send(:redis_key))).to be_false
          expect(
            @org_user_owner.in_database["SELECT 1 FROM pg_roles WHERE rolname = '#{api_key.db_role}'"].first
          ).to be_nil
        end

        it 'deletes client_application and friends' do
          user = create_user(email: 'clientapp@example.com', username: 'clientapp', password: @user_password)

          user.new_client_application
          user.client_application.access_tokens << Carto::AccessToken.create(
            token: "access_token",
            secret: "access_secret",
            callback_url: "http://callback2",
            verifier: "v2",
            scope: nil,
            client_application_id: user.client_application.id
          )

          user.client_application.oauth_tokens << Carto::OauthToken.create!(
            token: "oauth_token",
            secret: "oauth_secret",
            callback_url: "http//callback.com",
            verifier: "v1",
            scope: nil,
            client_application_id: user.client_application.id
          )

          base_key = "rails:oauth_access_tokens:#{user.client_application.access_tokens.first.token}"

          client_application = Carto::ClientApplication.find_by(user_id: user.id)

          expect(Carto::ClientApplication.where(user_id: user.id).count).to eq 2
          tokens = Carto::OauthToken.where(client_application_id: client_application.id)
          expect(tokens).to_not be_empty
          expect(tokens.length).to eq 2
          $api_credentials.keys.should include(base_key)

          user.destroy

          expect(Carto::ClientApplication.find_by(user_id: user.id)).to be_nil
          expect(Carto::AccessToken.where(user_id: user.id).first).to be_nil
          expect(Carto::OauthToken.where(user_id: user.id).first).to be_nil
          $api_credentials.keys.should_not include(base_key)
        end

        it 'deletes oauth_apps and friends' do
          owner_oauth_app = create_user(email: 'owner@example.com', username: 'oauthappowner', password: @user_password)
          user = create_user(email: 'oauth@example.com', username: 'oauthapp', password: @user_password)

          oauth_app = create(:oauth_app, user_id: owner_oauth_app.id)
          oauth_app_user = oauth_app.oauth_app_users.create!(user_id: user.id)
          oac = oauth_app_user.oauth_authorization_codes.create!(scopes: ['offline'])
          access_token, refresh_token = oac.exchange!

          app = Carto::OauthApp.where(user_id: owner_oauth_app.id).first
          users = app.oauth_app_users
          o_user = users.first
          refresh_token = Carto::OauthRefreshToken.where(oauth_app_user_id: o_user.id).first
          access_token = Carto::OauthAccessToken.where(oauth_app_user_id: o_user.id).first
          api_keys = Carto::ApiKey.where(user_id: user.id, type: 'oauth').all
          expect(users.count).to eq 1
          expect(refresh_token).to eq refresh_token
          expect(access_token).to eq access_token
          expect(api_keys.count).to eq 1

          expect(user.destroy).to be_true

          app = Carto::OauthApp.where(user_id: user.id).first
          users = Carto::OauthAppUser.where(user_id: user.id, oauth_app: oauth_app.id).first
          refresh_token = Carto::OauthRefreshToken.where(oauth_app_user_id: oauth_app_user.id).first
          access_token = Carto::OauthAccessToken.where(oauth_app_user_id: oauth_app_user.id).first
          api_key = Carto::ApiKey.where(user_id: user.id, type: 'oauth').first
          expect(app).to be_nil
          expect(users).to be_nil
          expect(refresh_token).to be_nil
          expect(access_token).to be_nil
          expect(api_key).to be_nil
        end
      end
    end
  end

  describe '#destroy' do
    def create_full_data
      carto_user = create(:carto_user)
      user = ::User[carto_user.id]
      table = create_table(user_id: carto_user.id, name: 'My first table', privacy: UserTable::PRIVACY_PUBLIC)
      canonical_visualization = table.table_visualization

      map = create(:carto_map_with_layers, user_id: carto_user.id)
      carto_visualization = create(:carto_visualization, user: carto_user, map: map)
      visualization = CartoDB::Visualization::Member.new(id: carto_visualization.id).fetch

      # Force ORM to cache layers (to check if they are deleted later)
      canonical_visualization.map.layers
      visualization.map.layers

      user_layer = Layer.create(kind: 'tiled')
      user.add_layer(user_layer)

      [user, table, [canonical_visualization, visualization], user_layer]
    end

    def check_deleted_data(user_id, table_id, visualizations, layer_id)
      ::User[user_id].should be_nil
      visualizations.each do |visualization|
        Carto::Visualization.exists?(visualization.id).should be_false
        visualization.map.layers.each { |layer| Carto::Layer.exists?(layer.id).should be_false }
      end
      Carto::UserTable.exists?(table_id).should be_false
      Carto::Layer.exists?(layer_id).should be_false
    end

    it 'destroys all related information' do
      user, table, visualizations, layer = create_full_data

      ::User[user.id].destroy

      check_deleted_data(user.id, table.id, visualizations, layer.id)
    end

    it 'destroys all related information, even for viewer users' do
      user, table, visualizations, layer = create_full_data
      user.viewer = true
      user.save
      user.reload

      user.destroy

      check_deleted_data(user.id, table.id, visualizations, layer.id)
    end
  end

  describe 'User#destroy_cascade' do
    include_context 'organization with users helper'

    it 'allows deletion even with shared entities' do
      table = create_random_table(@org_user_1)
      share_table_with_user(table, @org_user_1)

      @org_user_1.destroy_cascade

      ::User[@org_user_1.id].should_not be
    end
  end

  describe "#regressions" do
    it "Tests geocodings and data import FK not breaking user destruction" do
      user = create_user
      user_id = user.id

      data_import_id = '11111111-1111-1111-1111-111111111111'

      SequelRails.connection.run(%Q{
        INSERT INTO data_imports("data_source","data_type","table_name","state","success","logger","updated_at",
          "created_at","tables_created_count",
          "table_names","append","id","table_id","user_id",
          "service_name","service_item_id","stats","type_guessing","quoted_fields_guessing","content_guessing","server","host",
          "resque_ppid","upload_host","create_visualization","user_defined_limits")
          VALUES('test','url','test','complete','t','11111111-1111-1111-1111-111111111112',
            '2015-03-17 00:00:00.94006+00','2015-03-17 00:00:00.810581+00','1',
            'test','f','#{data_import_id}','11111111-1111-1111-1111-111111111113',
            '#{user_id}','public_url', 'test',
            '[{"type":".csv","size":5015}]','t','f','t','test','0.0.0.0','13204','test','f','{"twitter_credits_limit":0}');
        })

      SequelRails.connection.run(%Q{
        INSERT INTO geocodings("table_name","processed_rows","created_at","updated_at","formatter","state",
          "id","user_id",
          "cache_hits","kind","geometry_type","processable_rows","real_rows","used_credits",
          "data_import_id"
          ) VALUES('importer_123456','197','2015-03-17 00:00:00.279934+00','2015-03-17 00:00:00.536383+00','field_1','finished',
            '11111111-1111-1111-1111-111111111114','#{user_id}','0','admin0','polygon','195','0','0',
            '#{data_import_id}');
        })

      user.destroy

      ::User.find(id:user_id).should eq nil

    end
  end
end
