Carto::Common::Logger.install

# Log more easily from all models
ActiveRecord::Base.class_eval do
  include ::LoggerHelper
  extend ::LoggerHelper
end

Sequel::Model.class_eval do
  include ::LoggerHelper
  extend ::LoggerHelper
end
