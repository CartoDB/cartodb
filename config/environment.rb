# Load the rails application
require File.expand_path('../application', __FILE__)

module Rails
 class Application
   class Configuration

     def database_configuration
       require 'erb'
       db_config = YAML::load(ERB.new(IO.read(paths["config/database"].first)).result)
       if ENV['RAILS_DATABASE_NAME']
         @overriden_database_name = ENV['RAILS_DATABASE_NAME']
         db_config[Rails.env]['database'] = @overriden_database_name
#         puts db_config;
       end
       db_config
     end 
   end 
 end 
end


# Initialize the rails application
CartoDB::Application.initialize!
