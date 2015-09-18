require 'active_record'

::Sequel::DATABASES.each{|d| d.sql_log_level = :debug }

if ENV['RAILS_DATABASE_FILE'] 
  @dbconfig = YAML.load(File.read(File.join(Rails.root, 'config/' + ENV['RAILS_DATABASE_FILE'])))  
else 
  @dbconfig = YAML.load(File.read(File.join(Rails.root, 'config/database.yml'))) 
end 
# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
@dbconfig[Rails.env]['adapter'] = 'postgresql'
ActiveRecord::Base.establish_connection @dbconfig[Rails.env].merge({:prepared_statements => false})
# INFO: console debugging purposes
ActiveRecord::Base.logger = Logger.new(STDOUT) if Rails.env == 'development'
