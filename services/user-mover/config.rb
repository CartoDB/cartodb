require 'pg'

module CartoDB
  module DataMover
    class Config
      def self.load_config
        root = File.expand_path(File.dirname(__FILE__))
        config = YAML.load(File.read(File.join(root, '../../config/app_config.yml')))
        database = YAML.load(File.read(File.join(root, '../../config/database.yml')))
        rails_env = ENV['RAILS_ENV'] || Rails.env || 'production'
        @config = {
          rails_env: rails_env,
          dbname: ENV['DB_NAME'] || database[rails_env]['database'],
          dbuser: ENV['DB_USER'] || database[rails_env]['username'],
          dbpass: ENV['DB_PASS'] || database[rails_env]['password'],
          dbhost: ENV['DB_HOST'] || database[rails_env]['host'],
          dbport: ENV['DB_PORT'] || database[rails_env]['port'] || 5432,

          user_dbport: ENV['USER_DB_PORT'] || ENV['DB_PORT'] || database[rails_env]['port'] || 5432,
          connect_timeout: ENV['CONNECT_TIMEOUT'] || ENV['CONNECT_TIMEOUT'] || database[rails_env]['connect_timeout'] || 5,

          redis_port: ENV['REDIS_PORT'] || config[rails_env]['redis']['port'],
          redis_host: ENV['REDIS_HOST'] || config[rails_env]['redis']['host']
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
