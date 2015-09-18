# Load the rails application
require File.expand_path('../application', __FILE__)

module Rails
 class Application
   class Configuration

     def database_configuration
       require 'erb'
       if ENV['RAILS_DATABASE_FILE']
         db_config = YAML.load(File.read(File.join(Rails.root, 'config/' + ENV['RAILS_DATABASE_FILE'])))
       else
         db_config = YAML.load(File.read(File.join(Rails.root, 'config/database.yml')))
       end
       db_config
     end
   end
 end
end


# Initialize the rails application
CartoDB::Application.initialize!
