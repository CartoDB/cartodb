# encoding: utf-8

require 'carto/storage'

module Carto
  class Asset < ActiveRecord::Base
    belongs_to :user, class_name: Carto::User
    belongs_to :organization, class_name: Carto::Organization

    serialize :storage_info, CartoJsonSymbolizerSerializer
    validates :storage_info, carto_json_symbolizer: true
    validates :storage_info, presence: true, if: :organization
    validate :validate_storage_info, if: Proc.new { organization && storage_info }

    def before_destroy
      if organization_id
        location = storage_info[:location]
        storage_type = storage_info[:type]
        identifier = storage_info[:identifier]

        Storage.instance.for(location, preferred_type: storage_type).remove(identifier)
      end

      super
    end

    private

    def validate_storage_info
      schema = Definition.instance.load_from_file('lib/formats/asset/storage_info.json')
      indifferent_storage_info = storage_info.with_indifferent_access

      errs = JSON::Validator::fully_validate(schema, indifferent_storage_info)
      errors.add(:storage_info, errs.join(', ')) if errs.any?
    end
  end
end
