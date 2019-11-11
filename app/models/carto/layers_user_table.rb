require 'active_record'

module Carto
  class LayersUserTable < ActiveRecord::Base

    belongs_to :layer, class_name: Carto::Layer
    belongs_to :user_table, class_name: Carto::UserTable

  end
end
