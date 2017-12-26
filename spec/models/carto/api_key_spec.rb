# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::ApiKey do
  include_context 'users helper'

  def grant(database_schema, table_name, permissions: ['insert', 'select', 'update', 'delete'])
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
    api_key = Carto::ApiKey.create!(user_id: @carto_user1.id, type: Carto::ApiKey::TYPE_REGULAR,
                                    name: 'full', grants: [grant(@table1.database_schema, @table1.name)])

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
  end
end
