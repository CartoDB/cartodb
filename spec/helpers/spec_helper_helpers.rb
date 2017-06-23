module SpecHelperHelpers
  def clean_redis_databases
    $tables_metadata.flushdb
    $api_credentials.flushdb
    $users_metadata.flushdb
  end

  def clean_metadata_database
    if ENV['STELLAR'].present?
      SequelRails.connection.disconnect
      system "#{ENV['STELLAR']} restore"
    else
      protected_tables = [:schema_migrations, :spatial_ref_sys]
      SequelRails.connection.tables.each do |t|
        if !protected_tables.include?(t)
          begin
            SequelRails.connection.run("TRUNCATE TABLE \"#{t}\" CASCADE")
          rescue Sequel::DatabaseError => e
            raise e unless e.message =~ /PG::Error: ERROR:  relation ".*" does not exist/
          end
        end
      end
    end
  end

  def close_pool_connections
    # To avoid Travis and connection leaks
    $pool.close_connections!
  end

  def drop_leaked_test_user_databases
    user_database_names = SequelRails.connection[
      "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
    ]

    user_database_names.map(:datname).each do |user_database_name|
      puts "Dropping leaked test database #{user_database_name}"
      CartoDB::UserModule::DBService.terminate_database_connections(
        user_database_name, ::SequelRails.configuration.environment_for(Rails.env)['host']
      )
      SequelRails.connection.run("drop database \"#{user_database_name}\"")
    end
  end

  def delete_database_test_users
    usernames = SequelRails.connection['SELECT u.usename FROM pg_catalog.pg_user u'].map do |r|
      r.values.first
    end

    usernames.each do |username|
      SequelRails.connection.run("drop user \"#{username}\"") if username =~ /^test_cartodb_user_/
    end
  end
end
