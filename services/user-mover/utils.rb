require 'open3'
require 'tempfile'

module CartoDB
  module DataMover
    module Utils
      def conn_string(user, host, port, name)
        %{#{!user ? '' : '-U ' + user} -h #{host} -p #{port} -d #{name} }
      end

      def database_name_prefix
        return "cartodb_user_" if CartoDB::DataMover::Config[:rails_env] == 'production'
        return "cartodb_dev_user_" if CartoDB::DataMover::Config[:rails_env] == 'development'
        "cartodb_#{CartoDB::DataMover::Config[:rails_env]}_user_"
      end

      def db_username_prefix
        return "cartodb_user_" if CartoDB::DataMover::Config[:rails_env] == 'production'
        return "development_cartodb_user_" if CartoDB::DataMover::Config[:rails_env] == 'development'
        return "test_cartodb_user_" if CartoDB::DataMover::Config[:rails_env] == 'test'
        "cartodb_#{CartoDB::DataMover::Config[:rails_env]}_user_"
      end

      def user_database(user_id)
        "#{database_name_prefix}#{user_id}_db"
      end

      def publicuser(user_id)
        "cartodb_publicuser_#{user_id}"
      end

      def database_username(user_id)
        "#{db_username_prefix}#{user_id}"
      end

      def metadata_pg_conn
        @metadata_conn ||= PG.connect(host: CartoDB::DataMover::Config.config[:dbhost],
                                      user: CartoDB::DataMover::Config.config[:dbuser],
                                      dbname: CartoDB::DataMover::Config.config[:dbname],
                                      port: CartoDB::DataMover::Config.config[:dbport],
                                      connect_timeout: CartoDB::DataMover::Config.config[:connect_timeout])
      end

      def metadata_redis_conn
        @redis_conn ||= Redis.new(host: CartoDB::DataMover::Config.config[:redis_host], port: CartoDB::DataMover::Config.config[:redis_port], db: 5)
      end

      def set_user_mover_banner(user_id)
        migration_banner = 'WARNING: Your user is under a maintenance operation set in read-only mode. Account modifications during this time might be lost.'
        u = ::Carto::User.where(id: user_id).first
        u.update_column(:notification, migration_banner)
      end

      def remove_user_mover_banner(user_id)
        user = ::Carto::User.where(id: user_id).first
        # User might not exist because this might be run after an exception, before users are created
        user.update_column(:notification, nil) if user
      end

      def run_command(cmd)
        logger.debug "Running command: \"#{cmd}\""
        Tempfile.open('datamover') do |f|
          begin
            run_command_with_log(cmd, f)
          ensure
            f.close(true)
          end
        end
      end

      def run_command_with_log(cmd, file)
        return_code = nil
        log_message = ''
        logger.debug("Writing command output '#{cmd}' to #{file.path}")
        Open3.popen2e(cmd) do |_stdin, stdout_and_stderr, wait_thr|
          stdout_and_stderr.each do |line|
            message = line.strip + "\n"
            log_message += message
            file.write(message)
          end
          return_code = wait_thr.value
        end
        logger.debug(log_message)
        throw "Error running #{cmd}, output code: #{return_code}, message: #{log_message}" if return_code != 0
      end

      def get_pg_dump_bin_path(conn)
        bin_version = get_database_version_for_binaries(conn)
        Cartodb.get_config(:user_migrator, 'pg_dump_bin_path', bin_version) || 'pg_dump'
      end

      def get_pg_restore_bin_path(conn)
        bin_version = get_database_version_for_binaries(conn)
        Cartodb.get_config(:user_migrator, 'pg_restore_bin_path', bin_version) || 'pg_restore'
      end

      def get_database_version_for_binaries(conn)
        version = get_database_version(conn)
        shorten_version(version)
      end

      def get_database_version(conn)
        version = conn.query("SELECT version()").first['version']
        version_match = version.match(/(PostgreSQL (([0-9]+\.?){2,3})).*/)
        version_match[2] if version_match
      end

      def shorten_version(version)
        version[0...version.rindex('.')] if version
      end

      def default_logger
        my_logger = ::Logger.new(STDOUT)
        my_logger.level = ::Logger::DEBUG
        my_logger.formatter = ::Logger::Formatter.new
        my_logger
      end
    end
  end
end
