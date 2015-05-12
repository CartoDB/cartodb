require 'active_record'

@dbconfig = YAML.load(File.read(File.join(Rails.root, 'config/database.yml')))
# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
@dbconfig[Rails.env]['adapter'] = 'postgresql'
ActiveRecord::Base.establish_connection @dbconfig[Rails.env]
# INFO: console debugging purposes
ActiveRecord::Base.logger = Logger.new(STDOUT) if Rails.env == 'development'

