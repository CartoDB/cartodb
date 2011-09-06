# Let's monkey patch instead of using a fork
# Original patches from: https://github.com/ferblape/sequel-rails
module Rails
  module Sequel
    
    @@connections = {}
    
    # Get or setup a connection for a given environment
    def self.connection(environment=nil)
      environment ||= Rails.env
      @@connections[environment] ||= setup(environment)
    end

    def self.setup(environment=nil)
      environment ||= Rails.env
      puts "[sequel] Setting up the #{environment.inspect} environment:"

      @@connections[environment] ||= ::Sequel.connect({:logger => configuration.logger}.merge(::Rails::Sequel.configuration.environment_for(environment.to_s)))
      @@connections[environment]
    end
    
    class Storage
      
      def host
        @host ||= config['host'] || 'localhost'
      end
      
      class Postgres < Storage
        def _create
          system(
            'createdb',
            '-E',
            charset,
            '-U',
            username,
            '-h',
            host,
            database
          )
        end

        def _drop
          system(
            'dropdb',
            '-U',
            username,
            '-h',
            host,
            database
          )
        end
      end
      
    end
    
  end
end