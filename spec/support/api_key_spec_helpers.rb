module ApiKeySpecHelpers

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

  def data_observatory_datasets_grant(
    datasets = ['carto-do.here.pointsofinterest_pointsofinterest_usa_latlon_v1_quarterly_v1']
  )
    {
      type: 'data-observatory',
      datasets: datasets
    }
  end

  def user_grant(data = ['profile'])
    {
      type: 'user',
      data: data
    }
  end

  def validate_view_api_key(owner_user, viewer_user, view_name, create_query, drop_query)
    owner_user.sequel_user.in_database.run(create_query)
    grants = [apis_grant(['sql']), database_grant(@table1.database_schema, view_name)]
    api_key = viewer_user.api_keys.create_regular_key!(name: 'grants_view', grants: grants)

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

    owner_user.in_database.run(drop_query)
    api_key.destroy
  end

  def create_schema(user, schema_name = 'test')
    drop_schema(user)
    create_function = '
      CREATE FUNCTION test._CDB_UserQuotaInBytes() RETURNS integer AS $$
      BEGIN
      RETURN 1;
      END; $$
      LANGUAGE PLPGSQL;
    '
    user.in_database(as: :superuser).execute("CREATE SCHEMA \"#{schema_name}\"")
    user.in_database(as: :superuser).execute(create_function)
  end

  def grant_user(user, schema_name = 'test')
    sql = "GRANT CREATE ON SCHEMA \"#{schema_name}\" to \"#{user.database_username}\""
    user.in_database(as: :superuser).execute(sql)
  end

  def create_api_key(user, schema_name = 'test', permissions = ['create'])
    grants = [schema_grant(schema_name, schema_permissions: permissions), apis_grant]
    user.api_keys.create_regular_key!(name: 'wadus', grants: grants)
  end

  def create_oauth_api_key(user, schema_name = 'test', permissions = ['create'], role = 'test')
    grants = [schema_grant(schema_name, schema_permissions: permissions), apis_grant]
    user.api_keys.create_oauth_key!(name: 'wadus', grants: grants, ownership_role_name: role)
  end

  def drop_schema(user, schema_name = 'test')
    sql = "DROP SCHEMA IF EXISTS \"#{schema_name}\" CASCADE"
    user.in_database(as: :superuser).execute(sql)
  end

  def create_select_drop_check(connection, schema, table_name, drop = true)
    connection.execute("create table \"#{schema}\".#{table_name} as select 1 as test")
    connection.execute("select count(1) from \"#{schema}\".#{table_name}") do |result|
      result[0]['count'].should eq '1'
    end
    connection.execute("drop table \"#{schema}\".#{table_name}") if drop
  end

end
