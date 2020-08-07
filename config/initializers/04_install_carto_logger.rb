Carto::Common::Logger.install

# Log more easily from all models
ActiveRecord::Base.class_eval { include ::LoggerHelper }
Sequel::Model.class_eval { include ::LoggerHelper }
