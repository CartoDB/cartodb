require 'active_record'
require_dependency 'carto/configuration'

# Make Sequel messages (SQL stastements) to have debug level.
# They'll' appear in the logs only if the Logger's level is 0 (debug).
# Note that Rails.logger will be used.
::Sequel::DATABASES.each{|d| d.sql_log_level = :debug }

@dbconfig = Carto::Conf.new.db_config

# INFO: our current database.yml sets Sequel PostgreSQL adapter, which is called 'postgres'. Rails' is 'postgresql'
active_record_custom_conf = { :prepared_statements => false, 'adapter' => 'postgresql' }
ActiveRecord::Base.establish_connection @dbconfig[Rails.env].merge(active_record_custom_conf)

# For consistency, in devevelopment environment,  we'll make SQL statements originated in ActiveRecord appear
# in the same log (STDOUT) as the messages from Sequel (note that for development Rails.logger is configured as STDOUT)
if Rails.env == 'development'
  ActiveRecord::Base.logger = Logger.new(STDOUT)
  ActiveRecord::Base.logger.level = 0 # :debug
end
