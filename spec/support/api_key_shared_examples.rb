RSpec.shared_examples 'API key model' do
  before do
    @table1 = create_table(user_id: carto_user.id)
    @table2 = create_table(user_id: carto_user.id)
  end

  # TODO: fix broken spec after migrating to new CI
  xit 'can grant insert, select, update delete to a database role' do
    grants = [database_grant(@table1.database_schema, @table1.name), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)

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
    api_key = carto_user.api_keys.create_regular_key!(name: 'only_update', grants: grants)

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("select count(1) from #{@table1.name}") do |result|
        result[0]['count'].should eq '0'
      end

      connection.execute("update #{@table1.name} set name = 'wadus2' where name = 'wadus'")
    end
  end

  it 'grants create tables on schema' do
    table1 = create_table(user_id: carto_user.id)
    grants = [schema_grant(table1.database_schema), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'only_update', grants: grants)

    table1.destroy
    with_connection_from_api_key(api_key) do |connection|
      create_select_drop_check(connection, table1.database_schema, table1.name)
    end
  end

  it 'master role is able to drop the table created by regular api with schema grants' do
    grants = [schema_grant(carto_user.database_schema), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'drop_by_master', grants: grants)

    with_connection_from_api_key(api_key) do |connection|
      create_select_drop_check(connection, carto_user.database_schema, 'test_table', false)
    end

    carto_user.in_database.execute("drop table test_table")
  end

  it 'reassigns role ownerships after deleting a regular API key' do
    grants = [schema_grant(carto_user.database_schema), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'drop_test', grants: grants)

    with_connection_from_api_key(api_key) do |connection|
      create_select_drop_check(connection, carto_user.database_schema, 'test_table', false)
    end

    api_key.destroy

    ownership_query = "select pg_catalog.pg_get_userbyid(relowner) as owner from pg_class where relname = 'test_table'"
    carto_user.in_database.execute(ownership_query) do |result|
      result[0]['owner'].should eq carto_user.database_username
    end
    carto_user.in_database.execute("drop table test_table")
  end

  it 'fails to grant to a non-existent schema' do
    expect {
      grants = [schema_grant('not-exists'), apis_grant]
      carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
    }.to raise_exception(ActiveRecord::RecordInvalid, /can only grant schema permissions you have/)
  end

  it 'fails to grant to a non-existent table' do
    expect {
      grants = [database_grant(carto_user.database_schema, 'not-exists'), apis_grant]
      carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
    }.to raise_exception(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
  end

  it 'fails to grant to system table' do
    expect {
      grants = [database_grant('cartodb', 'cdb_tablemetadata'), apis_grant]
      carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
    }.to raise_exception ActiveRecord::RecordInvalid
  end

  it 'fails to access system tables' do
    api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: [apis_grant])

    with_connection_from_api_key(api_key) do |connection|
      ['cdb_tablemetadata', 'cdb_analysis_catalog'].each do |table|
        expect {
          connection.execute("select count(1) from cartodb.#{table}")
        }.to raise_exception /permission denied/
      end
    end
  end

  it 'fails to access schemas not granted' do
    api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: [apis_grant])

    with_connection_from_api_key(api_key) do |connection|
      expect {
        connection.execute("create table \"#{@table1.database_schema}\".test as select 1 as test")
      }.to raise_exception /permission denied/
    end
  end

  it 'fails to grant to system schema' do
    expect {
      grants = [schema_grant('information_schema'), apis_grant]
      carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
    }.to raise_exception ActiveRecord::RecordInvalid
  end

  it 'fails to create table in system schema' do
    api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: [apis_grant])

    with_connection_from_api_key(api_key) do |connection|
      expect {
        connection.execute("create table information_schema.test as select 1 as test")
      }.to raise_exception /permission denied/
    end
  end

  it 'grants to a double quoted table name' do
    table = create_table(user_id: carto_user.id)
    original_table_name = table.qualified_table_name
    carto_user.sequel_user.in_database.run("ALTER TABLE #{original_table_name} RENAME TO \"wadus\"\"wadus\"")
    grants = [database_grant(carto_user.database_schema, 'wadus"wadus'), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'valid_table_name', grants: grants)

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("select count(1) from \"wadus\"\"wadus\"") do |result|
        result[0]['count'].should eq '0'
      end
    end
  end

  # TODO: fix broken spec after migration
  xit 'grants view' do
    view_name = 'cool_view'

    validate_view_api_key(carto_user, other_user, view_name, "CREATE VIEW #{view_name} AS SELECT * FROM #{@table1.name}", "DROP VIEW #{view_name}")

    validate_view_api_key(
      carto_user,
      other_user,
      view_name,
      "CREATE MATERIALIZED VIEW #{view_name} AS SELECT * FROM #{@table1.name}",
      "DROP MATERIALIZED VIEW #{view_name}"
    )
  end

  it 'show ownership of the tables for the user' do
    grants = [schema_grant(carto_user.database_schema), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'table_owner_test', grants: grants)

    with_connection_from_api_key(api_key) do |connection|
      create_select_drop_check(connection, carto_user.database_schema, 'test_table', false)
    end

    permissions = api_key.table_permissions_from_db

    permissions.each do |p|
      if p.name == 'test_table'
        p.owner.should eq true
      end
    end

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("drop table \"#{carto_user.database_schema}\".test_table")
    end
  end

  it 'regular key owner with creation permission can cartodbfy tables' do
    grants = [schema_grant(carto_user.database_schema), apis_grant]
    api_key = carto_user.api_keys.create_regular_key!(name: 'table_owner_test', grants: grants)

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("create table \"#{carto_user.database_schema}\".test_table(id int)")
      connection.execute("select cdb_cartodbfytable('#{carto_user.database_schema}', 'test_table')")
      connection.execute("insert into \"#{carto_user.database_schema}\".test_table(the_geom, id) values ('0103000020E610000001000000040000009A99999999C9524048E17A14AE873D4000000000004053400000000000003D4066666666666653400000000000803D409A99999999C9524048E17A14AE873D40'::geometry, 1)")
      connection.execute("select * from \"#{carto_user.database_schema}\".test_table") do |result|
        result[0]['cartodb_id'].should eq '1'
        result[0]['id'].should eq '1'
      end
      connection.execute("drop table \"#{carto_user.database_schema}\".test_table")
    end
  end

  let (:grants) { [database_grant(@table1.database_schema, @table1.name), apis_grant] }

  describe '#destroy' do
    it 'removes the role from DB' do
      api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)

      sequel_user.in_database(as: :superuser) do |db|
        db.fetch("SELECT count(1) FROM pg_roles WHERE rolname = '#{api_key.db_role}'").first[:count].should eq 1
      end

      api_key.destroy

      sequel_user.in_database(as: :superuser) do |db|
        db.fetch("SELECT count(1) FROM pg_roles WHERE rolname = '#{api_key.db_role}'").first[:count].should eq 0
      end
    end

    it 'removes the role from Redis' do
      api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)

      $users_metadata.hgetall(api_key.send(:redis_key)).should_not be_empty

      api_key.destroy

      $users_metadata.hgetall(api_key.send(:redis_key)).should be_empty
    end

    it 'invalidates varnish cache' do
      CartoDB::Varnish.any_instance.expects(:purge).with("#{sequel_user.database_name}.*").at_least(1)

      api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
      api_key.destroy
    end
  end

  describe '#regenerate_token!' do
    it 'regenerates the value in Redis only after save' do
      api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)

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
      api_key = carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)

      CartoDB::Varnish.any_instance.expects(:purge).with("#{sequel_user.database_name}.*").at_least(1)

      api_key.regenerate_token!
      api_key.save!
    end
  end

  describe '#table_permission_from_db' do
    before do
      @public_table = create_table(user_id: carto_user.id)
      @public_table.table_visualization.update_attributes(privacy: 'public')
    end

    it 'loads newly created grants for role' do
      grants = [database_grant(sequel_user.database_schema, @table1.name), apis_grant(['maps', 'sql'])]
      api_key = carto_user.api_keys.create_regular_key!(name: 'wadus', grants: grants)

      sql = "grant SELECT on table \"#{@table2.database_schema}\".\"#{@table2.name}\" to \"#{api_key.db_role}\""
      sequel_user.in_database(as: :superuser).run(sql)

      table_permission = api_key_table_permissions(api_key, @table2.database_schema, @table2.name)
      table_permission.should be
      table_permission.permissions.should include('select')

      api_key.destroy
    end

    it 'doesn\'t show removed table' do
      permissions = ['insert', 'select', 'update', 'delete']
      grants = [database_grant(sequel_user.database_schema, @table1.name, permissions: permissions), apis_grant]
      api_key = carto_user.api_keys.create_regular_key!(name: 'wadus', grants: grants)

      permissions.each do |permission|
        api_key_table_permissions(api_key, @table1.database_schema, @table1.name).permissions.should include(permission)
      end

      sql = "drop table \"#{sequel_user.database_schema}\".\"#{@table1.name}\""
      sequel_user.in_database(as: :superuser).run(sql)

      api_key_table_permissions(api_key, @table1.database_schema, @table1.name).should be_nil

      api_key.destroy
    end

    it 'shows public tables' do
      api_key = carto_user.api_keys.default_public.first
      unless carto_user.has_organization?
        api_key_table_permissions(api_key, @public_table.database_schema, @public_table.name)
          .permissions.should eq ['select']
      end
    end
  end

  describe '#schema_permission_from_db' do
    before do
      @public_table = create_table(user_id: carto_user.id)
    end

    it 'loads newly created grants for role' do
      schema_name = 'test'
      grants = [apis_grant(['maps', 'sql'])]
      api_key = carto_user.api_keys.create_regular_key!(name: 'wadus', grants: grants)

      schema_permission = api_key_schema_permissions(api_key, schema_name)
      schema_permission.should be_nil

      create_schema(carto_user)
      sql = "GRANT CREATE ON SCHEMA \"#{schema_name}\" to \"#{api_key.db_role}\""
      sequel_user.in_database(as: :superuser).run(sql)

      schema_permission = api_key_schema_permissions(api_key, schema_name)
      schema_permission.should be
      schema_permission.permissions.should include('create')

      drop_schema(carto_user)
      api_key.destroy
    end

    it 'doesn\'t show removed schema' do
      schema_name = 'test'
      create_schema(carto_user)
      grant_user(carto_user)
      api_key = create_api_key(carto_user)

      permissions = ['create']
      permissions.each do |permission|
        api_key_schema_permissions(api_key, schema_name).permissions.should include(permission)
      end

      drop_schema(carto_user)
      api_key_schema_permissions(api_key, schema_name).should be_nil

      api_key.destroy
    end

    it 'grants creation in schema to master role' do
      schema_name = 'test'
      create_schema(carto_user)
      grant_user(carto_user)
      api_key = create_api_key(carto_user)

      master_api_key = carto_user.api_keys.master.first

      permissions = ['create']
      permissions.each do |permission|
        api_key_schema_permissions(master_api_key, schema_name).permissions.should include(permission)
      end

      drop_schema(carto_user)
      api_key_schema_permissions(master_api_key, schema_name).should be_nil

      api_key.destroy
    end

    it 'shows public schemas' do
      api_key = carto_user.api_keys.default_public.first
      unless carto_user.has_organization?
        api_key_schema_permissions(api_key, @public_table.database_schema)
          .permissions.should eq ['usage']
      end
    end
  end

  describe 'master api key' do
    it 'user has a master key with the user db_role' do
      api_key = carto_user.api_keys.master.first
      api_key.should be
      api_key.db_role.should eq carto_user.database_username
      api_key.db_password.should eq carto_user.database_password
    end

    it 'cannot create more than one master key' do
      expect {
        carto_user.api_keys.create_master_key!
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'create master api key works' do
      api_key = carto_user.api_keys.master.first
      api_key.destroy

      carto_user.api_keys.create_master_key!

      api_key = carto_user.api_keys.master.first
      api_key.should be
      api_key.db_role.should eq carto_user.database_username
      api_key.db_password.should eq carto_user.database_password
    end

    it 'cannot create a non master api_key with master as the name' do
      expect {
        carto_user.api_keys.create_regular_key!(name: Carto::ApiKey::NAME_MASTER, grants: [apis_grant])
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'token must match user api key' do
      api_key = carto_user.api_keys.master.first
      api_key.token = 'wadus'
      api_key.save.should be_false
      api_key.errors.full_messages.should include "Token must match user model for master keys"
    end
  end

  describe 'default public api key' do
    it 'user has a default public key with the public_db_user role' do
      api_key = carto_user.api_keys.default_public.first
      api_key.should be
      api_key.db_role.should eq carto_user.database_public_username
      api_key.db_password.should eq CartoDB::PUBLIC_DB_USER_PASSWORD
    end

    it 'cannot create more than one default public key' do
      expect {
        carto_user.api_keys.create_default_public_key!
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'cannot create a non default public api_key with default public name' do
      expect {
        carto_user.api_keys.create_regular_key!(name: Carto::ApiKey::NAME_DEFAULT_PUBLIC, grants: [apis_grant])
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'cannot change token' do
      api_key = carto_user.api_keys.default_public.first
      api_key.token = 'wadus'
      api_key.save.should be_false
      api_key.errors.full_messages.should include "Token must be default_public for default public keys"
    end
  end

  describe 'data services api key' do
    before do
      @db_role = Carto::DB::Sanitize.sanitize_identifier("carto_role_#{SecureRandom.hex}")
      Carto::ApiKey.any_instance.stubs(:db_role).returns(@db_role)
    end

    it 'cdb_conf info with dataservices' do
      grants = [apis_grant, data_services_grant]
      api_key = carto_user.api_keys.create_regular_key!(name: 'dataservices', grants: grants)
      expected = { username: carto_user.username,
                   permissions: ['geocoding', 'routing', 'isolines', 'observatory'],
                   ownership_role_name: '' }

      sequel_user.in_database(as: :superuser) do |db|
        query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
        config = db.fetch(query).first[:cdb_conf_getconf]
        expect(JSON.parse(config, symbolize_names: true)).to eql(expected)
      end

      api_key.destroy

      sequel_user.in_database(as: :superuser) do |db|
        query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
        db.fetch(query).first[:cdb_conf_getconf].should be_nil
      end
    end

    it 'cdb_conf info without dataservices' do
      grants = [apis_grant]
      api_key = carto_user.api_keys.create_regular_key!(name: 'testname', grants: grants)
      expected = { username: carto_user.username, permissions: [], ownership_role_name: '' }

      sequel_user.in_database(as: :superuser) do |db|
        query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
        config = db.fetch(query).first[:cdb_conf_getconf]
        expect(JSON.parse(config, symbolize_names: true)).to eql(expected)
      end

      api_key.destroy

      sequel_user.in_database(as: :superuser) do |db|
        query = "SELECT cartodb.cdb_conf_getconf('#{Carto::ApiKey::CDB_CONF_KEY_PREFIX}#{api_key.db_role}')"
        db.fetch(query).first[:cdb_conf_getconf].should be_nil
      end
    end

    it 'fails with invalid data services' do
      grants = [apis_grant, data_services_grant(['invalid-service'])]

      expect {
        carto_user.api_keys.create_regular_key!(name: 'bad', grants: grants)
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it 'fails with valid and invalid data services' do
      grants = [apis_grant, data_services_grant(services: ['geocoding', 'invalid-service'])]

      expect {
        carto_user.api_keys.create_regular_key!(name: 'bad', grants: grants)
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
        carto_user.api_keys.create_regular_key!(name: 'bad', grants: grants)
      }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe 'data observatory datasets api key' do
    before do
      db_role = Carto::DB::Sanitize.sanitize_identifier("carto_role_#{SecureRandom.hex}")
      described_class.any_instance.stubs(:db_role).returns(db_role)
    end

    it 'grants with data observatory datasets' do
      grants = [apis_grant(['maps']), data_observatory_datasets_grant]
      expected = ['carto-do.here.pointsofinterest_pointsofinterest_usa_latlon_v1_quarterly_v1']
      api_key = carto_user.api_keys.create_regular_key!(name: 'data-observatory', grants: grants)

      expect(api_key).not_to be(nil)
      expect(api_key.data_observatory_datasets).to eq(expected)
      data_observatory_datasets = $users_metadata.hget(api_key.send(:redis_key), :data_observatory_datasets)
      expect(JSON.parse(data_observatory_datasets, symbolize_names: true)).to eql(expected)
    end
  end

  describe 'filter by type' do
    it 'filters just master' do
      api_keys = carto_user.api_keys.by_type([Carto::ApiKey::TYPE_MASTER])
      api_keys.count.should eq 1
      api_keys.first.type.should eq Carto::ApiKey::TYPE_MASTER
    end

    it 'filters just default_public' do
      api_keys = carto_user.api_keys.by_type([Carto::ApiKey::TYPE_DEFAULT_PUBLIC])
      api_keys.count.should eq 1
      api_keys.first.type.should eq Carto::ApiKey::TYPE_DEFAULT_PUBLIC
    end

    it 'filters default_public and master' do
      api_keys = carto_user.api_keys.by_type([Carto::ApiKey::TYPE_DEFAULT_PUBLIC, Carto::ApiKey::TYPE_MASTER])
      api_keys.count.should eq 2
    end

    it 'filters all if empty array' do
      api_keys = carto_user.api_keys.by_type([])
      api_keys.count.should eq 2
    end

    it 'filters all if nil type' do
      api_keys = carto_user.api_keys.by_type(nil)
      api_keys.count.should eq 2
    end
  end

  describe '#data_observatory_permissions?' do
    it 'returns true when it has the do api grant' do
      apis_grants = {
        type: "apis",
        apis: ["do"]
      }
      api_key = carto_user.api_keys.create_regular_key!(name: 'x', grants: [apis_grants])

      expect(api_key.data_observatory_permissions?).to eq true
    end

    it 'returns false when it does not have the do api grant' do
      apis_grants = {
        type: "apis",
        apis: ["sql"]
      }
      api_key = carto_user.api_keys.create_regular_key!(name: 'x', grants: [apis_grants])

      expect(api_key.data_observatory_permissions?).to eq false
    end
  end
end
