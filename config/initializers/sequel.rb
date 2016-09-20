require 'active_record'
require_dependency 'carto/configuration'

::Sequel::DATABASES.each{|d| d.sql_log_level = :debug }

@dbconfig = Carto::Conf.new.db_config

# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
@dbconfig[Rails.env]['adapter'] = 'postgresql'
ActiveRecord::Base.establish_connection @dbconfig[Rails.env].merge({:prepared_statements => false})
# INFO: console debugging purposes
ActiveRecord::Base.logger = Logger.new(STDOUT) if Rails.env == 'development'
