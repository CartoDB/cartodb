# encoding: UTF-8

require 'active_record'

module Carto
  class Geocoding < ActiveRecord::Base

    def self.processable_rows(table_service)
      dataset = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name)
      dataset = dataset.where(cartodb_georef_status: nil) if dataset.columns.include?(:cartodb_georef_status)
      dataset.count
    end

   belongs_to :user

   private

  end
end
