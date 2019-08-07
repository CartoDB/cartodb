require 'spec_helper_min'
require 'support/helpers'
require 'helpers/database_connection_helper'

describe Carto::ApiKey do
  include CartoDB::Factories
  include DatabaseConnectionHelper

  def api_key_table_permissions(api_key, schema, table_name)
    api_key.table_permissions_from_db.find do |tp|
      tp.schema == schema && tp.name == table_name
    end
  end

  def api_key_schema_permissions(api_key, schema)
    api_key.schema_permissions_from_db.find do |sp|
      sp.name == schema
    end
  end

  def database_grant(database_schema = 'wadus', table_name = 'wadus',
                     owner = false,
                     permissions: ['insert', 'select', 'update', 'delete'],
                     schema_permissions: ['create'])
    {
      type: "database",
      tables: [
        {
          schema: database_schema,
          name: table_name,
          owner: owner,
          permissions: permissions
        }
      ],
      schemas: [
        {
          name: database_schema,
          permissions: schema_permissions
        }
      ]
    }
  end

  def table_grant(database_schema = 'wadus', table_name = 'wadus', owner = false,
                  permissions: ['insert', 'select', 'update', 'delete'])
    {
      type: "database",
      tables: [
        {
          schema: database_schema,
          name: table_name,
          owner: owner,
          permissions: permissions
        }
      ]
    }
  end

  def schema_grant(database_schema = 'wadus', schema_permissions: ['create'])
    {
      type: "database",
      schemas: [
        {
          name: database_schema,
          permissions: schema_permissions
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
          e.message.should match /permission denied .* #{@table2.name}/
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

    it 'can grant only with select and update permissions' do
      grants = [database_grant(@table1.database_schema, @table1.name, permissions: ['select', 'update']), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'only_update', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("select count(1) from #{@table1.name}") do |result|
          result[0]['count'].should eq '0'
        end

        connection.execute("update #{@table1.name} set name = 'wadus2' where name = 'wadus'")
      end
    end

    it 'grants create tables on schema' do
      table1 = create_table(user_id: @carto_user1.id)
      grants = [schema_grant(table1.database_schema), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'only_update', grants: grants)

      table1.destroy
      with_connection_from_api_key(api_key) do |connection|
        connection.execute("create table \"#{table1.database_schema}\".#{table1.name} as select 1 as test")
        connection.execute("select count(1) from \"#{table1.database_schema}\".#{table1.name}") do |result|
          result[0]['count'].should eq '1'
        end
      end
    end

    it 'master role is able to drop the table created by regular api with schema grants' do
      grants = [schema_grant(@carto_user1.database_schema), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'drop_by_master', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("create table \"#{@carto_user1.database_schema}\".test_table as select 1 as test")
        connection.execute("select count(1) from \"#{@carto_user1.database_schema}\".test_table") do |result|
          result[0]['count'].should eq '1'
        end
      end

      @carto_user1.in_database.execute("drop table test_table")
    end

    it 'reassign created table ownership after delete the api key' do
      grants = [schema_grant(@carto_user1.database_schema), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'drop_test', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("create table \"#{@carto_user1.database_schema}\".test_table as select 1 as test")
        connection.execute("select count(1) from \"#{@carto_user1.database_schema}\".test_table") do |result|
          result[0]['count'].should eq '1'
        end
      end

      api_key.destroy

      ownership_query = "select pg_catalog.pg_get_userbyid(relowner) as owner from pg_class where relname = 'test_table'"
      @carto_user1.in_database.execute(ownership_query) do |result|
        result[0]['owner'].should eq @carto_user1.database_username
      end
      @carto_user1.in_database.execute("drop table test_table")
    end

    it 'fails to grant to a non-existent schema' do
      expect {
        grants = [schema_grant('not-exists'), apis_grant]
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception(ActiveRecord::RecordInvalid, /can only grant schema permissions you have/)
    end

    it 'fails to grant to a non-existent table' do
      expect {
        grants = [database_grant(@carto_user1.database_schema, 'not-exists'), apis_grant]
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
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

    it 'fails to access schemas not granted' do
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: [apis_grant])

      with_connection_from_api_key(api_key) do |connection|
        expect {
          connection.execute("create table \"#{@table1.database_schema}\".test as select 1 as test")
        }.to raise_exception /permission denied/
      end
    end

    it 'fails to grant to system schema' do
      expect {
        grants = [schema_grant('information_schema'), apis_grant]
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception ActiveRecord::RecordInvalid
    end

    it 'fails to create table in system schema' do
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: [apis_grant])

      with_connection_from_api_key(api_key) do |connection|
        expect {
          connection.execute("create table information_schema.test as select 1 as test")
        }.to raise_exception /permission denied/
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
          e.message.should match /permission denied .* #{@table1.name}/
        end

        connection.execute("select count(1) from #{view_name}") do |result|
          result[0]['count'].should eq '0'
        end
      end

      @user1.in_database.run(drop_query)
      api_key.destroy
    end

    it 'show ownership of the tables for the user' do
      grants = [schema_grant(@carto_user1.database_schema), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'table_owner_test', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("create table \"#{@carto_user1.database_schema}\".test_table as select 1 as test")
        connection.execute("select count(1) from \"#{@carto_user1.database_schema}\".test_table") do |result|
          result[0]['count'].should eq '1'
        end
      end

      permissions = api_key.table_permissions_from_db

      permissions.each do |p|
        if p.name == 'test_table'
          p.owner.should eq true
        end
      end

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("drop table \"#{@carto_user1.database_schema}\".test_table")
      end
    end

    it 'regular key owner with creation permission can cartodbfy tables' do
      grants = [schema_grant(@carto_user1.database_schema), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'table_owner_test', grants: grants)

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("create table \"#{@carto_user1.database_schema}\".test_table(id int)")
        connection.execute("select cdb_cartodbfytable('#{@carto_user1.database_schema}', 'test_table')")
        connection.execute("insert into \"#{@carto_user1.database_schema}\".test_table(the_geom, id) values ('0103000020E610000001000000040000009A99999999C9524048E17A14AE873D4000000000004053400000000000003D4066666666666653400000000000803D409A99999999C9524048E17A14AE873D40'::geometry, 1)")
        connection.execute("select * from \"#{@carto_user1.database_schema}\".test_table") do |result|
          result[0]['cartodb_id'].should eq '1'
          result[0]['id'].should eq '1'
        end
        connection.execute("drop table \"#{@carto_user1.database_schema}\".test_table")
      end
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
      it 'fails with invalid schema permissions' do
        database_grants = {
          type: "database",
          tables: [
            {
              schema: "wadus",
              name: "wadus",
              permissions: ["insert"]
            }
          ],
          schemas: [
            {
              name: "wadus",
              permissions: ["create", "insert"]
            }
          ]
        }
        grants = [apis_grant, database_grants]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: grants)
        }.to raise_exception(ActiveRecord::RecordInvalid, /value "insert" did not match one of the following values/)
      end

      it 'validates with no tables' do
        database_grants = {
          type: "database"
        }
        grants = [apis_grant, database_grants]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: grants)
        }.to_not raise_error
      end

      it 'validates tables_metadata grant' do
        database_grants = {
          type: "database",
          table_metadata: []
        }
        grants = [apis_grant, database_grants]
        expect {
          @carto_user1.api_keys.create_regular_key!(name: 'x', grants: grants)
        }.to_not raise_error
      end

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

      context 'without enough regular api key quota' do
        before(:all) do
          @carto_user1.regular_api_key_quota = 0
          @carto_user1.save
        end

        after(:all) do
          @carto_user1.regular_api_key_quota = be_nil
          @carto_user1.save
        end

        it 'raises an exception when creating a regular key' do
          grants = [database_grant(@table1.database_schema, @table1.name), apis_grant]

          expect {
            @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
          }.to raise_exception(CartoDB::QuotaExceeded, /limit of API keys/)
        end
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

        table_permission = api_key_table_permissions(api_key, @table2.database_schema, @table2.name)
        table_permission.should be
        table_permission.permissions.should include('select')

        api_key.destroy
      end

      it 'doesn\'t show removed table' do
        permissions = ['insert', 'select', 'update', 'delete']
        grants = [database_grant(@user1.database_schema, @table1.name, permissions: permissions), apis_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'wadus', grants: grants)

        permissions.each do |permission|
          api_key_table_permissions(api_key, @table1.database_schema, @table1.name).permissions.should include(permission)
        end

        sql = "drop table \"#{@user1.database_schema}\".\"#{@table1.name}\""
        @user1.in_database(as: :superuser).run(sql)

        api_key_table_permissions(api_key, @table1.database_schema, @table1.name).should be_nil

        api_key.destroy
      end

      it 'shows public tables' do
        api_key = @carto_user1.api_keys.default_public.first
        unless @carto_user1.has_organization?
          api_key_table_permissions(api_key, @public_table.database_schema, @public_table.name)
            .permissions.should eq ['select']
        end
      end
    end

    describe '#schema_permission_from_db' do
      before(:all) do
        @public_table = create_table(user_id: @carto_user1.id)
      end

      after(:all) do
        @public_table.destroy
      end

      it 'loads newly created grants for role' do
        schema_name = 'test'
        grants = [apis_grant(['maps', 'sql'])]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'wadus', grants: grants)

        schema_permission = api_key_schema_permissions(api_key, schema_name)
        schema_permission.should be_nil

        create_schema
        sql = "GRANT CREATE ON SCHEMA \"#{schema_name}\" to \"#{api_key.db_role}\""
        @user1.in_database(as: :superuser).run(sql)

        schema_permission = api_key_schema_permissions(api_key, schema_name)
        schema_permission.should be
        schema_permission.permissions.should include('create')

        drop_schema
        api_key.destroy
      end

      it 'doesn\'t show removed schema' do
        schema_name = 'test'
        create_schema
        grant_user
        api_key = create_api_key

        permissions = ['create']
        permissions.each do |permission|
          api_key_schema_permissions(api_key, schema_name).permissions.should include(permission)
        end

        drop_schema
        api_key_schema_permissions(api_key, schema_name).should be_nil

        api_key.destroy
      end

      it 'grants creation in schema to master role' do
        schema_name = 'test'
        create_schema
        grant_user
        api_key = create_api_key

        master_api_key = @carto_user1.api_keys.master.first

        permissions = ['create']
        permissions.each do |permission|
          api_key_schema_permissions(master_api_key, schema_name).permissions.should include(permission)
        end

        drop_schema
        api_key_schema_permissions(master_api_key, schema_name).should be_nil

        api_key.destroy
      end

      it 'shows public schemas' do
        api_key = @carto_user1.api_keys.default_public.first
        unless @carto_user1.has_organization?
          api_key_schema_permissions(api_key, @public_table.database_schema)
            .permissions.should eq ['usage']
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
      before :each do
        @db_role = Carto::DB::Sanitize.sanitize_identifier("carto_role_#{SecureRandom.hex}")
        Carto::ApiKey.any_instance.stubs(:db_role).returns(@db_role)
      end

      after :each do
        Carto::ApiKey.any_instance.unstub(:db_role)
      end

      it 'cdb_conf info with dataservices' do
        grants = [apis_grant, data_services_grant]
        api_key = @carto_user1.api_keys.create_regular_key!(name: 'dataservices', grants: grants)
        expected = { username: @carto_user1.username,
                     permissions: ['geocoding', 'routing', 'isolines', 'observatory'],
                     ownership_role_name: '' }

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
        expected = { username: @carto_user1.username, permissions: [], ownership_role_name: '' }

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

    describe 'filter by type' do
      it 'filters just master' do
        api_keys = @carto_user1.api_keys.by_type([Carto::ApiKey::TYPE_MASTER])
        api_keys.count.should eq 1
        api_keys.first.type.should eq Carto::ApiKey::TYPE_MASTER
      end

      it 'filters just default_public' do
        api_keys = @carto_user1.api_keys.by_type([Carto::ApiKey::TYPE_DEFAULT_PUBLIC])
        api_keys.count.should eq 1
        api_keys.first.type.should eq Carto::ApiKey::TYPE_DEFAULT_PUBLIC
      end

      it 'filters default_public and master' do
        api_keys = @carto_user1.api_keys.by_type([Carto::ApiKey::TYPE_DEFAULT_PUBLIC, Carto::ApiKey::TYPE_MASTER])
        api_keys.count.should eq 2
      end

      it 'filters all if empty array' do
        api_keys = @carto_user1.api_keys.by_type([])
        api_keys.count.should eq 2
      end

      it 'filters all if nil type' do
        api_keys = @carto_user1.api_keys.by_type(nil)
        api_keys.count.should eq 2
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
      grants = [table_grant(table.database_schema, table.name), apis_grant]
      expect {
        @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)
      }.to raise_exception ActiveRecord::RecordInvalid

      table.destroy
      other_user.destroy
    end

    it 'fails to grant to a non-owned schema' do
      other_user = TestUserFactory.new.create_test_user(unique_name('user'), @auth_organization)
      table = create_table(user_id: other_user.id)
      grants = [schema_grant(table.database_schema), apis_grant]
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
      grants = [table_grant(table_user1.database_schema, table_user1.name), apis_grant]
      api_key = @carto_user1.api_keys.create_regular_key!(name: 'full', grants: grants)

      user2.in_database.run("GRANT SELECT ON #{schema_and_table_user2} TO \"#{api_key.db_role}\"")

      expect { api_key.destroy! }.to_not raise_error

      table_user1.destroy
      table_user2.destroy
      user2.destroy
    end
  end

  describe 'org shared tables' do
    include_context 'organization with users helper'

    before :each do
      @shared_table = create_table(user_id: @carto_org_user_1.id)

      perm = @shared_table.table_visualization.permission
      perm.acl = [{ type: 'user', entity: { id: @carto_org_user_2.id }, access: 'rw' }]
      perm.save!
    end

    it 'should create an api key using a shared table' do
      grants = [apis_grant(['sql']), table_grant(@shared_table.database_schema, @shared_table.name)]
      api_key = @carto_org_user_2.api_keys.create_regular_key!(name: 'grants_shared', grants: grants)

      schema_table = "\"#{@shared_table.database_schema}\".\"#{@shared_table.name}\""

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("select count(1) from #{schema_table}") do |result|
          result[0]['count'].should eq '0'
        end
      end
      api_key.destroy
    end

    it 'should revoke permissions removing shared permissions (rw to r)' do
      grants = [apis_grant(['sql']), table_grant(@shared_table.database_schema, @shared_table.name)]
      api_key = @carto_org_user_2.api_keys.create_regular_key!(name: 'grants_shared', grants: grants)

      # remove shared permissions
      @shared_table.table_visualization.reload
      perm = @shared_table.table_visualization.permission
      perm.acl = [{ type: 'user', entity: { id: @carto_org_user_2.id }, access: 'r' }]
      perm.save!

      schema_table = "\"#{@shared_table.database_schema}\".\"#{@shared_table.name}\""

      with_connection_from_api_key(api_key) do |connection|
        connection.execute("select count(1) from #{schema_table}") do |result|
          result[0]['count'].should eq '0'
        end

        expect {
          connection.execute("insert into #{schema_table} (name) values ('wadus')")
        }.to raise_exception /permission denied/
      end

      api_key.destroy
    end

    it 'should revoke permissions removing shared permissions (rw to none)' do
      grants = [apis_grant(['sql']), table_grant(@shared_table.database_schema, @shared_table.name)]
      api_key = @carto_org_user_2.api_keys.create_regular_key!(name: 'grants_shared', grants: grants)

      # remove shared permissions
      @shared_table.table_visualization.reload
      perm = @shared_table.table_visualization.permission
      perm.acl = []
      perm.save!

      schema_table = "\"#{@shared_table.database_schema}\".\"#{@shared_table.name}\""

      with_connection_from_api_key(api_key) do |connection|
        expect {
          connection.execute("select count(1) from #{schema_table}")
        }.to raise_exception /permission denied/

        expect {
          connection.execute("insert into #{schema_table} (name) values ('wadus')")
        }.to raise_exception /permission denied/
      end

      api_key.destroy
    end
  end

  def create_schema(schema_name = 'test')
    drop_schema
    create_function = '
      CREATE FUNCTION test._CDB_UserQuotaInBytes() RETURNS integer AS $$
      BEGIN
      RETURN 1;
      END; $$
      LANGUAGE PLPGSQL;
    '
    @carto_user1.in_database(as: :superuser).execute("CREATE SCHEMA \"#{schema_name}\"")
    @carto_user1.in_database(as: :superuser).execute(create_function)
  end

  def create_role(role_name = 'test')
    drop_role
    @carto_user1.in_database(as: :superuser).execute("CREATE ROLE \"#{role_name}\"")
  end

  def drop_role(role_name = 'test')
    @carto_user1.in_database(as: :superuser).execute("DROP ROLE IF EXISTS \"#{role_name}\"")
  end

  def grant_user(schema_name = 'test')
    sql = "GRANT CREATE ON SCHEMA \"#{schema_name}\" to \"#{@carto_user1.database_username}\""
    @carto_user1.in_database(as: :superuser).execute(sql)
  end

  def create_api_key(schema_name = 'test', permissions = ['create'])
    grants = [schema_grant(schema_name, schema_permissions: permissions), apis_grant]
    @carto_user1.api_keys.create_regular_key!(name: 'wadus', grants: grants)
  end

  def create_oauth_api_key(schema_name = 'test', permissions = ['create'], role = 'test')
    grants = [schema_grant(schema_name, schema_permissions: permissions), apis_grant]
    @carto_user1.api_keys.create_oauth_key!(name: 'wadus', grants: grants, ownership_role_name: role)
  end

  def drop_schema(schema_name = 'test')
    sql = "DROP SCHEMA IF EXISTS \"#{schema_name}\" CASCADE"
    @carto_user1.in_database(as: :superuser).execute(sql)
  end
end
