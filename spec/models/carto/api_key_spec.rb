# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::ApiKey do
  include CartoDB::Factories

  def api_key_permissions(api_key, schema, table_name)
    api_key.table_permissions_from_db.find do |tp|
      tp.schema == schema && tp.name == table_name
    end
  end

  def database_grant(database_schema = 'wadus', table_name = 'wadus',
                     permissions: ['insert', 'select', 'update', 'delete'])
    {
      type: "database",
      tables: [
        {
          schema: database_schema,
          name: table_name,
          permissions: permissions
        }
      ]
    }
  end

  def apis_grant(apis = ['maps', 'sql'])
    {
      type: 'apis',
      apis: apis
    }
  end

  def with_connection_from_api_key(api_key)
    user = api_key.user

    options = ::SequelRails.configuration.environment_for(Rails.env).merge(
      'database' => user.database_name,
      'username' => api_key.db_role,
      'password' => api_key.db_password,
      'host' => user.database_host
    )
    connection = ::Sequel.connect(options)
    begin
      yield connection
    ensure
      connection.disconnect
    end
  end

  shared_examples_for 'api key' do
    before(:all) do
      @table1 = create_table(user_id: @carto_user1.id)
      @table2 = create_table(user_id: @carto_user1.id)
    end

    after(:all) do
      bypass_named_maps
      @table2.destroy
      @table1.destroy
    end

    after(:each) do
      @carto_user1.reload.api_keys.where(type: Carto::ApiKey::TYPE_REGULAR).each(&:delete)
    end

    it 'can grant insert, select, update delete to a database role' do
      grants = [database_grant(@table1.database_schema, @table1.name), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        begin
          connection.execute("select count(1) from #{@table2.name}")
        rescue Sequel::DatabaseError => e
          failed = true
          e.message.should include "permission denied for relation #{@table2.name}"
        end
        failed.should be_true

        connection.execute("select count(1) from #{@table1.name}") do |result|
          result[0]['count'].should eq '0'
        end

        connection.execute("insert into #{@table1.name} (name) values ('wadus')")

        connection.execute("select count(1) from #{@table1.name}") do |result|
          result[0]['count'].should eq '1'
        end

        connection.execute("update #{@table1.name} set name = 'wadus2' where name = 'wadus'")

        connection.execute("delete from #{@table1.name} where name = 'wadus2'")

        connection.execute("select count(1) from #{@table1.name}") do |result|
          result[0]['count'].should eq '0'
        end
      end

      api_key.destroy
    end

    it 'fails to grant to a non-existent table' do
      expect {
        grants = [database_grant(@carto_user1.database_schema, 'not-exists'), apis_grant]
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception Carto::UnprocesableEntityError
    end

    it 'fails to grant to system table' do
      expect {
        grants = [database_grant('cartodb', 'cdb_tablemetadata'), apis_grant]
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception ActiveRecord::RecordInvalid
    end

    it 'fails to access system tables' do
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: [apis_grant])

      with_connection_from_api_key(api_key) do |connection|
        ['cdb_tablemetadata', 'cdb_analysis_catalog'].each do |table|
          expect {
            connection.execute("select count(1) from cartodb.#{table}")
          }.to raise_exception /permission denied/
        end
      end
    end

    describe '#destroy' do
      it 'removes the role from DB' do
        grants = [database_grant(@table1.database_schema, @table1.name), apis_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

        @user1.in_database(as: :superuser) do |db|
          db.fetch("SELECT count(1) FROM pg_roles WHERE rolname = '#{api_key.db_role}'").first[:count].should eq 1
        end

        api_key.destroy

        @user1.in_database(as: :superuser) do |db|
          db.fetch("SELECT count(1) FROM pg_roles WHERE rolname = '#{api_key.db_role}'").first[:count].should eq 0
        end
      end

      it 'removes the role from Redis' do
        grants = [database_grant(@table1.database_schema, @table1.name), apis_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

        $users_metadata.hgetall(api_key.send(:redis_key)).should_not be_empty

        api_key.destroy

        $users_metadata.hgetall(api_key.send(:redis_key)).should be_empty
      end
    end

    describe '#regenerate_token!' do
      it 'regenerates the value in Redis only after save' do
        grants = [apis_grant, database_grant(@table1.database_schema, @table1.name)]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

        old_redis_key = api_key.send(:redis_key)
        $users_metadata.hgetall(old_redis_key).should_not be_empty

        api_key.regenerate_token!

        new_redis_key = api_key.send(:redis_key)
        new_redis_key.should_not be eq old_redis_key
        $users_metadata.hgetall(new_redis_key).should_not be_empty
        $users_metadata.hgetall(old_redis_key).should be_empty

        # Additional check that just saving doesn't change Redis
        api_key.save!

        $users_metadata.hgetall(new_redis_key).should_not be_empty
        $users_metadata.hgetall(old_redis_key).should be_empty
      end
    end

    describe 'validations' do
      it 'fails with several apis sections' do
        two_apis_grant = [apis_grant, apis_grant, database_grant]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
        }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one apis section is allowed/)
      end

      it 'fails with several database sections' do
        two_apis_grant = [apis_grant, database_grant, database_grant]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
        }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one database section is allowed/)
      end

      it 'fails when creating without apis grants' do
        grants = JSON.parse('
      [
        {
          "type": "database",
          "tables": [{
            "name": "something",
            "schema": "public",
            "permissions": [
              "select"
            ]
          },
          {
            "name": "another",
            "schema": "public",
            "permissions": ["insert", "update", "select"]
          }
          ]
        }
      ]', symbolize_names: true)
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: grants)
        }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one apis section is allowed/)
      end
    end

    describe '#table_permission_from_db' do
      before(:all) do
        @public_table = create_table(user_id: @carto_user1.id)
        @public_table.table_visualization.update_attributes(privacy: 'public')
      end

      after(:all) do
        @public_table.destroy
      end

      it 'loads newly created grants for role' do
        grants = [database_grant(@user1.database_schema, @table1.name), apis_grant(['maps', 'sql'])]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'wadus', grants: grants)

        sql = "grant SELECT on table \"#{@table2.database_schema}\".\"#{@table2.name}\" to \"#{api_key.db_role}\""
        @user1.in_database(as: :superuser).run(sql)

        table_permission = api_key_permissions(api_key, @table2.database_schema, @table2.name)
        table_permission.should be
        table_permission.permissions.should include('select')

        api_key.destroy
      end

      it 'doesn\'t show removed table' do
        permissions = ['insert', 'select', 'update', 'delete']
        grants = [database_grant(@user1.database_schema, @table1.name, permissions: permissions), apis_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'wadus', grants: grants)

        permissions.each do |permission|
          api_key_permissions(api_key, @table1.database_schema, @table1.name).permissions.should include(permission)
        end

        sql = "drop table \"#{@user1.database_schema}\".\"#{@table1.name}\""
        @user1.in_database(as: :superuser).run(sql)

        api_key_permissions(api_key, @table1.database_schema, @table1.name).should be_nil

        api_key.destroy
      end

      it 'shows public tables' do
        api_key = @carto_user1.api_keys.default_public.first
        unless @carto_user1.has_organization?
          api_key_permissions(api_key, @public_table.database_schema, @public_table.name)
            .permissions.should eq ['select']
        end
      end
    end

    describe 'master api key' do
      it 'user has a master key with the user db_role' do
        api_key = @carto_user1.api_keys.master.first
        api_key.should be
        api_key.db_role.should eq @carto_user1.database_username
        api_key.db_password.should eq @carto_user1.database_password
      end

      it 'cannot create more than one master key' do
        expect {
          @carto_user1.api_keys.create_master_key!
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'cannot create a non master api_key with master as the name' do
        expect {
          @carto_user1.api_keys.create_regular_key!(name: Carto::ApiKey::NAME_MASTER, grants: [apis_grant])
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'token must match user api key' do
        api_key = @carto_user1.api_keys.master.first
        api_key.token = 'wadus'
        api_key.save.should be_false
        api_key.errors.full_messages.should include "Token must match user model for master keys"
      end
    end

    describe 'default public api key' do
      it 'user has a default public key with the public_db_user role' do
        api_key = @carto_user1.api_keys.default_public.first
        api_key.should be
        api_key.db_role.should eq @carto_user1.database_public_username
        api_key.db_password.should eq CartoDB::PUBLIC_DB_USER_PASSWORD
      end

      it 'cannot create more than one default public key' do
        expect {
          @carto_user1.api_keys.create_default_public_key!
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'cannot create a non default public api_key with default public name' do
        expect {
          @carto_user1.api_keys.create_regular_key!(name: Carto::ApiKey::NAME_DEFAULT_PUBLIC, grants: [apis_grant])
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'cannot change token' do
        api_key = @carto_user1.api_keys.default_public.first
        api_key.token = 'wadus'
        api_key.save.should be_false
        api_key.errors.full_messages.should include "Token must be default_public for default public keys"
      end
    end
  end

  describe 'with plain users' do
    before(:all) do
      @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
      @user1 = FactoryGirl.create(:valid_user, private_tables_enabled: true, private_maps_enabled: true)
      @carto_user1 = Carto::User.find(@user1.id)
    end

    after(:all) do
      @auth_api_feature_flag.destroy
      @user1.destroy
    end

    it_behaves_like 'api key'
  end

  describe 'with organization users' do
    before(:all) do
      @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
      @auth_organization = FactoryGirl.create(:organization, quota_in_bytes: 1.gigabytes)
      @user1 = TestUserFactory.new.create_owner(@auth_organization)
      @carto_user1 = Carto::User.find(@user1.id)
    end

    after(:all) do
      @auth_api_feature_flag.destroy
      @user1.destroy
      @auth_organization.destroy
    end

    it_behaves_like 'api key'

    it 'fails to grant to a non-owned table' do
      other_user = TestUserFactory.new.create_test_user(unique_name('user'), @auth_organization)
      table = create_table(user_id: other_user.id)
      grants = [database_grant(table.database_schema, table.name), apis_grant]
      expect {
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception ActiveRecord::RecordInvalid

      table.destroy
      other_user.destroy
    end
  end
end
