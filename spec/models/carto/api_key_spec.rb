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

  def data_services_grant(services = ['geocoding', 'routing', 'isolines', 'observatory'])
    {
      type: 'dataservices',
      services: services
    }
  end

  def user_grant(data = ['profile'])
    {
      type: 'user',
      data: data
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
      @table3 = create_table(user_id: @carto_user1.id)
    end

    after(:all) do
      bypass_named_maps
      @table2.destroy
      @table1.destroy
      @table3.destroy
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
      }.to raise_exception(Carto::UnprocesableEntityError, /does not exist/)
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

    it 'grants to a double quoted table name' do
      old_name = @table3.name
      @user1.in_database.run("ALTER TABLE #{old_name} RENAME TO \"wadus\"\"wadus\"")
      grants = [database_grant(@carto_user1.database_schema, 'wadus"wadus'), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'valid_table_name', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("select count(1) from \"wadus\"\"wadus\"") do |result|
          result[0]['count'].should eq '0'
        end
      end

      api_key.destroy
      @user1.in_database.run("ALTER TABLE \"wadus\"\"wadus\" RENAME TO #{old_name}")
    end

    it 'grants view' do
      view_name = 'cool_view'

      validate_view_api_key(
        view_name,
        "CREATE VIEW #{view_name} AS SELECT * FROM #{@table1.name}",
        "DROP VIEW #{view_name}"
      )

      validate_view_api_key(
        view_name,
        "CREATE MATERIALIZED VIEW #{view_name} AS SELECT * FROM #{@table1.name}",
        "DROP MATERIALIZED VIEW #{view_name}"
      )
    end

    def validate_view_api_key(view_name, create_query, drop_query)
      @user1.in_database.run(create_query)
      grants = [apis_grant(['sql']), database_grant(@table1.database_schema, view_name)]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'grants_view', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        begin
          connection.execute("select count(1) from #{@table1.name}")
        rescue Sequel::DatabaseError => e
          e.message.should include "permission denied for relation #{@table1.name}"
        end

        connection.execute("select count(1) from #{view_name}") do |result|
          result[0]['count'].should eq '0'
        end
      end

      @user1.in_database.run(drop_query)
      api_key.destroy
    end

    let (:grants) { [database_grant(@table1.database_schema, @table1.name), apis_grant] }

    describe '#destroy' do
      it 'removes the role from DB' do
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
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

        $users_metadata.hgetall(api_key.send(:redis_key)).should_not be_empty

        api_key.destroy

        $users_metadata.hgetall(api_key.send(:redis_key)).should be_empty
      end

      it 'invalidates varnish cache' do
        CartoDB::Varnish.any_instance.expects(:purge).with("#{@user1.database_name}.*").at_least(1)

        api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
        api_key.destroy
      end
    end

    describe '#regenerate_token!' do
      it 'regenerates the value in Redis only after save' do
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

      it 'invalidates varnish cache' do
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

        CartoDB::Varnish.any_instance.expects(:purge).with("#{@user1.database_name}.*").at_least(1)

        api_key.regenerate_token!
        api_key.save!
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

      it 'fails with several dataservices sections' do
        two_apis_grant = [apis_grant, data_services_grant, data_services_grant]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
        }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one dataservices section is allowed/)
      end

      it 'fails with several user sections' do
        two_apis_grant = [apis_grant, user_grant, user_grant]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
        }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one user section is allowed/)
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

      it 'create master api key works' do
        api_key = @carto_user1.api_keys.master.first
        api_key.destroy

        @carto_user1.api_keys.create_master_key!

        api_key = @carto_user1.api_keys.master.first
        api_key.should be
        api_key.db_role.should eq @carto_user1.database_username
        api_key.db_password.should eq @carto_user1.database_password
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

    describe 'data services api key' do
      it 'cdb_conf info with dataservices' do
        grants = [apis_grant, data_services_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'dataservices', grants: grants)
        expected = { username: @carto_user1.username, permissions: ['geocoding', 'routing', 'isolines', 'observatory'] }

        @user1.in_database(as: :superuser) do |db|
          query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
          config = db.fetch(query).first[:cdb_conf_getconf]
          expect(JSON.parse(config, symbolize_names: true)).to eql(expected)
        end

        api_key.destroy

        @user1.in_database(as: :superuser) do |db|
          query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
          db.fetch(query).first[:cdb_conf_getconf].should be_nil
        end
      end

      it 'cdb_conf info without dataservices' do
        grants = [apis_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'testname', grants: grants)
        expected = { username: @carto_user1.username, permissions: [] }

        @user1.in_database(as: :superuser) do |db|
          query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
          config = db.fetch(query).first[:cdb_conf_getconf]
          expect(JSON.parse(config, symbolize_names: true)).to eql(expected)
        end

        api_key.destroy

        @user1.in_database(as: :superuser) do |db|
          query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
          db.fetch(query).first[:cdb_conf_getconf].should be_nil
        end
      end

      it 'fails with invalid data services' do
        grants = [apis_grant, data_services_grant(['invalid-service'])]

        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'bad', grants: grants)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'fails with valid and invalid data services' do
        grants = [apis_grant, data_services_grant(services: ['geocoding', 'invalid-service'])]

        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'bad', grants: grants)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'fails with invalid data services key' do
        grants = [
          apis_grant,
          {
            type: 'dataservices',
            invalid: ['geocoding']
          }
        ]

        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'bad', grants: grants)
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end

  describe 'with plain users' do
    before(:all) do
      @user1 = FactoryGirl.create(:valid_user, private_tables_enabled: true, private_maps_enabled: true)
      @carto_user1 = Carto::User.find(@user1.id)
    end

    after(:all) do
      @user1.destroy
    end

    it_behaves_like 'api key'
  end

  describe 'with organization users' do
    before(:all) do
      @auth_organization = FactoryGirl.create(:organization, quota_in_bytes: 1.gigabytes)
      @user1 = TestUserFactory.new.create_owner(@auth_organization)
      @carto_user1 = Carto::User.find(@user1.id)
    end

    after(:all) do
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

    it 'drop role with grants of objects owned by other user' do
      user2 = TestUserFactory.new.create_test_user(unique_name('user'), @auth_organization)
      table_user2 = create_table(user_id: user2.id)
      schema_and_table_user2 = "\"#{table_user2.database_schema}\".#{table_user2.name}"

      table_user1 = create_table(user_id: @carto_user1.id)
      grants = [database_grant(table_user1.database_schema, table_user1.name), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

      user2.in_database.run("GRANT SELECT ON #{schema_and_table_user2} TO \"#{api_key.db_role}\"")

      expect { api_key.destroy! }.to_not raise_error

      table_user1.destroy
      table_user2.destroy
      user2.destroy
    end
  end
end
