# encoding: UTF-8

require 'active_record'
require_relative '../../../services/table-geocoder/lib/exceptions'

module Carto
  class Geocoding < ActiveRecord::Base

    PUBLIC_ATTRIBUTES = [:id, :table_id, :table_name, :state, :kind, :country_code, :region_code, :formatter,
                        :geocoder_type, :geometry_type, :error, :processed_rows, :cache_hits, :processable_rows,
                        :real_rows, :price, :used_credits, :remaining_quota, :country_column, :region_column,
                        :data_import_id, :error_code]

    def self.processable_rows(table_service, force_all_rows=false)
      dataset = table_service.owner.in_database.select.from(table_service.sequel_qualified_table_name)
      if !force_all_rows && dataset.columns.include?(:cartodb_georef_status)
        dataset = dataset.exclude(cartodb_georef_status: true)
      end
      dataset.count
    end

    belongs_to :user
    belongs_to :automatic_geocoding

    def public_values
      Hash[PUBLIC_ATTRIBUTES.map{ |k| [k, (self.send(k) rescue self[k].to_s)] }]
    end

    def error
      additional_info = Carto::GeocoderErrors.additional_info(error_code)
      if additional_info
        { title: additional_info.title, description: additional_info.what_about }
      else
        { title: 'Geocoding error', description: '' }
      end
    end

    def price
      return 0 unless used_credits.to_i > 0
      (user.geocoding_block_price * used_credits) / Carto::User::GEOCODING_BLOCK_SIZE.to_f
    end

    def remaining_quota
      user.remaining_geocoding_quota
    end

    # TODO: Properly migrate log to AR and remove this
    def log
      CartoDB::Log[log_id]
    end
  end
end
