module SpecHelperHelpers
  def clean_redis_databases
    $tables_metadata.flushdb
    $api_credentials.flushdb
    $users_metadata.flushdb
  end

  def clean_metadata_database
    protected_tables = [:schema_migrations, :spatial_ref_sys]
    Rails::Sequel.connection.tables.each do |t|
      if !protected_tables.include?(t)
        begin
          Rails::Sequel.connection.run("TRUNCATE TABLE \"#{t}\" CASCADE")
        rescue Sequel::DatabaseError => e
          raise e unless e.message =~ /PG::Error: ERROR:  relation ".*" does not exist/
        end
      end
    end
  end

  def close_pool_connections
    # To avoid Travis and connection leaks
    $pool.close_connections!
  end

  def drop_leaked_test_user_databases
    Rails::Sequel.connection[
      "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
    ].map(:datname).each { |user_database_name|
      puts "Dropping leaked test database #{user_database_name}"
      CartoDB::UserModule::DBService.terminate_database_connections(
        user_database_name, ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
      )
      Rails::Sequel.connection.run("drop database \"#{user_database_name}\"")
    }
  end

  def delete_database_test_users
    Rails::Sequel.connection['SELECT u.usename FROM pg_catalog.pg_user u'].map { |r|
      r.values.first
    }.each do |username|
      Rails::Sequel.connection.run("drop user \"#{username}\"") if username =~ /^test_cartodb_user_/
    end
  end
end
