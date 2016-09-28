require 'active_record'
require_dependency 'carto/configuration'

::Sequel::DATABASES.each{|d| d.sql_log_level = :debug }

@dbconfig = Carto::Conf.new.db_config

# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
active_record_custom_conf = { :prepared_statements => false, 'adapter' => 'postgresql' }
ActiveRecord::Base.establish_connection @dbconfig[Rails.env].merge(active_record_custom_conf)
# INFO: console debugging purposes
ActiveRecord::Base.logger = Logger.new(STDOUT) if Rails.env == 'development'
