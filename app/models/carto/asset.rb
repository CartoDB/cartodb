# encoding: utf-8

require 'carto/organization_assets_service'

module Carto
  class Asset < ActiveRecord::Base
    belongs_to :user, class_name: Carto::User
    belongs_to :organization, class_name: Carto::Organization

    serialize :storage_info, CartoJsonSymbolizerSerializer
    validates :storage_info, carto_json_symbolizer: true

    validates :user,         presence: true, unless: :organization
    validates :organization, presence: true, unless: :user
    validates :storage_info, presence: true, if: :organization

    validate :validate_storage_info, if: :storage_info

    before_destroy :remove_asset_from_storage, if: :organization

    def self.from_organization(organization:, resource:)
      storage_info, url = OrganizationAssetsService.instance.upload(organization, resource)

      new(organization: organization,
          public_url: url,
          storage_info: storage_info,
          kind: 'organization_asset')
    end

    private

    def validate_storage_info
      schema = Definition.instance.load_from_file('lib/formats/asset/storage_info.json')
      indifferent_storage_info = storage_info.with_indifferent_access

      errs = JSON::Validator::fully_validate(schema, indifferent_storage_info)
      errors.add(:storage_info, errs.join(', ')) if errs.any?
    end

    def remove_asset_from_storage
      Carto::OrganizationAssetsService.instance.remove(storage_info)
    end
  end
end
