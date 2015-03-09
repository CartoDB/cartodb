require 'active_record'

::Sequel::DATABASES.each{|d| d.sql_log_level = :debug }

@environment = ENV['RAILS_ENV'] || 'development'
@dbconfig = YAML.load(File.read('config/database.yml'))
# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
@dbconfig[@environment]['adapter'] = 'postgresql'
ActiveRecord::Base.establish_connection @dbconfig[@environment]
# TODO: console debugging purposes
ActiveRecord::Base.logger = Logger.new(STDOUT)
