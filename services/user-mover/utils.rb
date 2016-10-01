# coding: utf-8
require 'open3'

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
        u = ::Carto::User.where(id: user_id).first
        u.update_column(:notification, nil)
      end

      def run_command(cmd)
        logger.debug "Running command: \"#{cmd}\""
        return_code = nil
        Open3.popen2e(cmd) do |_stdin, stdout_and_stderr, wait_thr|
          stdout_and_stderr.each { |line| logger.debug line.strip }
          return_code = wait_thr.value
        end
        throw "Error running #{cmd}, output code: #{return_code}" if return_code != 0
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
