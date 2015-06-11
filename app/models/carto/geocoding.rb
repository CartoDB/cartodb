# encoding: UTF-8

require 'active_record'

module Carto
  class Geocoding < ActiveRecord::Base

    PUBLIC_ATTRIBUTES = [:id, :table_id, :state, :kind, :country_code, :region_code, :formatter, :geometry_type, :error, :processed_rows, :cache_hits, :processable_rows, :real_rows, :price, :used_credits, :remaining_quota, :country_column, :region_column, :data_import_id]

    def self.processable_rows(table_service)
      dataset = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name)
      dataset = dataset.where(cartodb_georef_status: nil) if dataset.columns.include?(:cartodb_georef_status)
      dataset.count
    end

    belongs_to :user

    def public_values
      Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
    end

    def error
      { title: 'Geocoding error', description: '' }
    end
    
    def price
      return 0 unless used_credits.to_i > 0
      (user.geocoding_block_price * used_credits) / Carto::User::GEOCODING_BLOCK_SIZE.to_f
    end

    def remaining_quota
      user.remaining_geocoding_quota
    end

    private

  end
end
