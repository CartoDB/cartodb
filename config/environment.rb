# Load the rails application
require File.expand_path('../application', __FILE__)
require 'carto/configuration'

module Rails
  class Application
    class Configuration
      include Carto::Configuration

      def database_configuration
        require 'erb'
        db_config_file
      end
    end
  end
end

# Initialize the rails application
CartoDB::Application.initialize!
