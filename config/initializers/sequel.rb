require_dependency 'carto/configuration'
require 'sequel_rails/railties/legacy_model_config'

Sequel::Model.plugin :after_initialize

::Sequel::DATABASES.each do |d|
  # Make Sequel messages (SQL stastements) to have debug level.
  # They'll' appear in the logs only if the Logger's level is 0 (debug).
  # Note that Rails.logger will be used.
  d.sql_log_level = :debug

  d.extension(:pagination)
end
@dbconfig = Carto::Conf.new.db_config

# For consistency, in devevelopment environment,  we'll make SQL statements originated in ActiveRecord appear
# in the same log (STDOUT) as the messages from Sequel (note that for development Rails.logger is configured as STDOUT)
if Rails.env == 'development'
  ActiveRecord::Base.logger = Logger.new(STDOUT)
  ActiveRecord::Base.logger.level = Logger::DEBUG
end

# Disable schema dumping, it is broken with the combination of sequel-rails >= 0.4.4 and sequel < 3.47
Rails.application.config.sequel.schema_dump = false

Sequel::Model.class_eval { include ActiveRecordCompatibility }
