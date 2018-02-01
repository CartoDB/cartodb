# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::ApiKey do
  include_context 'users helper'

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

  before(:each) do
    @table1 = create_table(user_id: @carto_user1.id)
    @table2 = create_table(user_id: @carto_user1.id)
  end

  after(:each) do
    @table2.destroy
    @table1.destroy
  end

  it 'can grant insert, select, update delete to a database role' do
    api_key = Carto::ApiKey.create!(user_id: @carto_user1.id, type: Carto::ApiKey::TYPE_REGULAR, name: 'full',
                                    grants: [database_grant(@table1.database_schema, @table1.name), apis_grant])

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

  describe '#destroy' do
    it 'removes the role from DB' do
      api_key = Carto::ApiKey.create!(user_id: @carto_user1.id, type: Carto::ApiKey::TYPE_REGULAR, name: 'full',
                                      grants: [
                                        database_grant(@table1.database_schema,
                                                       @table1.name),
                                        apis_grant
                                      ])

      @user1.in_database(as: :superuser) do |db|
        db.fetch("SELECT count(1) FROM pg_roles WHERE rolname = '#{api_key.db_role}'").first[:count].should eq 1
      end

      api_key.destroy

      @user1.in_database(as: :superuser) do |db|
        db.fetch("SELECT count(1) FROM pg_roles WHERE rolname = '#{api_key.db_role}'").first[:count].should eq 0
      end
    end

    it 'removes the role from Redis' do
      api_key = Carto::ApiKey.create!(user_id: @carto_user1.id, type: Carto::ApiKey::TYPE_REGULAR, name: 'full',
                                      grants: [database_grant(@table1.database_schema, @table1.name), apis_grant])

      $users_metadata.hgetall(api_key.send(:redis_key)).should_not be_empty

      api_key.destroy

      $users_metadata.hgetall(api_key.send(:redis_key)).should be_empty
    end
  end

  describe '#create_token' do
    it 'regenerates the value in Redis only after save' do
      api_key = Carto::ApiKey.create!(user_id: @carto_user1.id, type: Carto::ApiKey::TYPE_REGULAR,
                                      name: 'full', grants: [apis_grant, database_grant(@table1.database_schema, @table1.name)])

      old_redis_key = api_key.send(:redis_key)
      $users_metadata.hgetall(old_redis_key).should_not be_empty

      api_key.create_token

      $users_metadata.hgetall(old_redis_key).should_not be_empty
      new_redis_key = api_key.send(:redis_key)
      $users_metadata.hgetall(new_redis_key).should be_empty

      api_key.save!

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
      api_key = Carto::ApiKey.new(user_id: @user1.id,
                                  type: Carto::ApiKey::TYPE_REGULAR,
                                  name: 'x',
                                  grants: two_apis_grant)
      api_key.valid?.should be_false
      api_key.errors.full_messages.should include 'Grants only one apis section is allowed'
    end

    it 'fails with several database sections' do
      two_apis_grant = [apis_grant, database_grant, database_grant]
      api_key = Carto::ApiKey.new(user_id: @user1.id,
                                  type: Carto::ApiKey::TYPE_REGULAR,
                                  name: 'x',
                                  grants: two_apis_grant)
      api_key.valid?.should be_false
      api_key.errors.full_messages.should include 'Grants only one database section is allowed'
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
    ]',
                          symbolize_names: true)
      api_key = Carto::ApiKey.new(user_id: @user1.id,
                                  type: Carto::ApiKey::TYPE_REGULAR,
                                  name: 'irrelevant',
                                  grants: grants)
      api_key.valid?.should be_false
      api_key.errors.full_messages.should include 'Grants only one apis section is allowed'
    end
  end

  describe '#table_permission_from_db' do
    it 'loads newly created grants for role' do
      api_key = Carto::ApiKey.create!(user_id: @user1.id,
                                      type: Carto::ApiKey::TYPE_REGULAR,
                                      name: 'wadus',
                                      grants: [
                                        database_grant('public', @table1.name),
                                        apis_grant(['maps', 'sql'])
                                      ])

      sql = "grant SELECT on table \"#{@table2.database_schema}\".\"#{@table2.name}\" to \"#{api_key.db_role}\""
      @user1.in_database(as: :superuser).run(sql)

      table_permission = api_key_permissions(api_key, @table2.database_schema, @table2.name)
      table_permission.should be
      table_permission.permissions.should include('select')

      api_key.destroy
    end

    it 'doesn\'t show removed table' do
      permissions = ['insert', 'select', 'update', 'delete']
      api_key = Carto::ApiKey.new(user_id: @user1.id,
                                  type: Carto::ApiKey::TYPE_REGULAR,
                                  name: 'wadus',
                                  grants: [
                                    database_grant('public', @table1.name, permissions: permissions),
                                    apis_grant(['maps', 'sql'])
                                  ])
      api_key.save!

      permissions.each do |permission|
        api_key_permissions(api_key, @table1.database_schema, @table1.name).permissions.should include(permission)
      end

      sql = "drop table #{@table1.name}"
      @user1.in_database(as: :superuser).run(sql)

      api_key_permissions(api_key, @table1.database_schema, @table1.name).should be_nil

      api_key.destroy
    end
  end
end
