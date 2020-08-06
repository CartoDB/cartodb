Carto::Common::Logger.install

# Log more easily from all ActiveRecord models
ActiveRecord::Base.class_eval { include ::LoggerHelper }
