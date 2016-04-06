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
                                      port: CartoDB::DataMover::Config.config[:dbport])
      end

      def metadata_redis_conn
        @redis_conn ||= Redis.new(host: CartoDB::DataMover::Config.config[:redis_host], port: CartoDB::DataMover::Config.config[:redis_port], db: 5)
      end

      def set_user_mover_banner(user_id)
        migration_banner = 'WARNING: Your user is under a maintenance operation set in read-only mode. Account modifications during this time might be lost.'
        u = ::User.where(id: user_id).first
        u.notification = migration_banner
        u.save
      end

      def remove_user_mover_banner(user_id)
        u = ::User.where(id: user_id).first
        u.notification = nil
        u.save
      end

      def run_command(cmd)
        p cmd
        IO.popen(cmd) do |io|
          puts io.gets while !io.eof?
        end
        throw "Error running #{cmd}, output code: #{$?}" if $? != 0
      end
    end
  end
end
