# encoding: UTF-8

require 'active_record'

class Carto::ExternalSource < ActiveRecord::Base
  
  # Seconds
  REFRESH_INTERVAL = 30*24*60*60

  has_many :external_data_imports

end
