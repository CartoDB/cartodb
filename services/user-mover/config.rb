require 'pg'
require 'carto/configuration'
require 'redis_factory'

module CartoDB
  module DataMover
    class Config
      def self.load_config
        root = File.expand_path(File.dirname(__FILE__))
        carto_config = Carto::Conf.new
        config = carto_config.app_config
        # get_conf should be private, but this class manages its own exceptions
        redis_config = RedisFactory.send(:get_conf)
        database = carto_config.db_config
        rails_env = ENV['RAILS_ENV'] || Rails.env || 'production'
        @config = {
          rails_env: rails_env,
          dbname: ENV['DB_NAME'] || database[rails_env]['database'],
          dbuser: ENV['DB_USER'] || database[rails_env]['username'],
          dbpass: ENV['DB_PASS'] || database[rails_env]['password'],
          dbhost: ENV['DB_HOST'] || database[rails_env]['host'],
          dbport: ENV['DB_PORT'] || database[rails_env]['port'] || 5432,

          user_dbport: ENV['USER_DB_PORT'] || ENV['DB_PORT'] || database[rails_env]['direct_port'] || 5432,
          connect_timeout: ENV['CONNECT_TIMEOUT'] || ENV['CONNECT_TIMEOUT'] || database[rails_env]['connect_timeout'] || 5,

          redis_port: ENV['REDIS_PORT'] || redis_config[:port],
          redis_host: ENV['REDIS_HOST'] || redis_config[:host]
        }
      end

      def self.config
        return @config if @config
        load_config
      end

      def self.[](args)
        config[args]
      end
    end
  end
end
