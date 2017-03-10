# encoding: utf-8

require_dependency 'carto/assets_service'
require_dependency 'carto/organization_assets_service'

module Carto
  class Asset < ActiveRecord::Base
    belongs_to :user, class_name: Carto::User
    belongs_to :organization, class_name: Carto::Organization

    serialize :storage_info, CartoJsonSymbolizerSerializer
    validates :storage_info, carto_json_symbolizer: true

    validates :user,         presence: true, unless: :organization
    validates :organization, presence: true, unless: :user
    validates :storage_info, presence: true, if: :organization
    validates :public_url,   presence: true

    validate :validate_storage_info, if: :storage_info

    before_destroy :remove_asset_from_storage, if: :storage_info

    def self.for_organization(organization:, resource:)
      storage_info, url = OrganizationAssetsService.instance.upload(organization, resource)

      new(organization: organization,
          public_url: url,
          storage_info: storage_info,
          kind: 'organization_asset')
    end

    def absolute_public_url
      uri = URI.parse(public_url)
      (uri.absolute? ? uri : URI.join(base_domain, uri)).to_s
    rescue URI::InvalidURIError
      public_url
    end

    private

    def validate_storage_info
      schema = Definition.instance.load_from_file('lib/formats/asset/storage_info.json')
      indifferent_storage_info = storage_info.with_indifferent_access

      errs = JSON::Validator::fully_validate(schema, indifferent_storage_info)
      errors.add(:storage_info, errs.join(', ')) if errs.any?
    end

    def remove_asset_from_storage
      Carto::AssetsService.new.remove(storage_info)
    end

    def base_domain
      CartoDB.base_domain_from_name(user ? user.subdomain : organization.name)
    end
  end
end
