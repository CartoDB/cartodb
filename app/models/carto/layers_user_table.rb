# encoding: utf-8

require 'active_record'

module Carto
  class LayersUserTable < ActiveRecord::Base

    belongs_to :layer, class_name: Carto::Layer
    belongs_to :user_table, class_name: Carto::UserTable, foreign_key: :table_id

  end
end
