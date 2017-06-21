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
    validates :public_url,   presence: true, unless: :asset_file

    validate :validate_storage_info, if: :storage_info
    validate :validate_file, if: :asset_file
    validate :download_file, if: :url

    before_destroy :remove_asset_from_storage, if: :storage_info

    attr_accessor :asset_file, :url

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

    VALID_EXTENSIONS = %w{ .jpeg .jpg .gif .png .svg }

    def validate_storage_info
      schema = Definition.instance.load_from_file('lib/formats/asset/storage_info.json')
      indifferent_storage_info = storage_info.with_indifferent_access

      errs = JSON::Validator::fully_validate(schema, indifferent_storage_info)
      errors.add(:storage_info, errs.join(', ')) if errs.any?
    end

    def download_file
      dir = Dir.mktmpdir
      stdout, stderr, status = Open3.capture3('wget', '-nv', '-P', dir, '-E', url)
      self.asset_file = Dir[File.join(dir, '*')][0]
      errors.add(:url, "is invalid") unless status.exitstatus == 0
    end

    def validate_file
      extension = asset_file_extension
      unless VALID_EXTENSIONS.include?(extension)
        errors.add(:file, "has invalid format")
        return
      end

      @file = open_file(asset_file)
      unless @file && File.readable?(@file.path)
        errors.add(:file, "is invalid")
        return
      end

      max_size_in_mb = (max_size.to_f / (1024 * 1024).to_f).round(2)
      if @file.size > max_size
        errors.add(:file, "is too big, #{max_size_in_mb}MB max")
        return
      end

      metadata = CartoDB::ImageMetadata.new(@file.path, extension: extension)
      errors.add(:file, "is too big, 1024x1024 max") if metadata.width > 1024 || metadata.height > 1024
      # If metadata reports no size, 99% sure not valid, so out
      errors.add(:file, "doesn't appear to be an image") if metadata.width == 0 || metadata.height == 0
    rescue => e
      errors.add(:file, "error while uploading: #{e.message}")
    end

    def remove_asset_from_storage
      Carto::AssetsService.new.remove(storage_info)
    end

    def base_domain
      CartoDB.base_domain_from_name(user ? user.subdomain : organization.name)
    end

    def asset_file_extension
      filename = asset_file.respond_to?(:original_filename) ? asset_file.original_filename : asset_file
      extension = File.extname(filename).downcase

      # Filename might include a postfix hash -- Rack::Test::UploadedFile adds it
      extension.gsub!(/\d+-\w+-\w+\z/, '') if Rails.env.test?

      extension if VALID_EXTENSIONS.include?(extension)
    end

    def open_file(handle)
      (handle.respond_to?(:path) ? handle : File.open(handle.to_s))
    rescue Errno::ENOENT
      nil
    end

    def max_size
      Cartodb.get_config(:assets, "max_file_size")
    end
  end
end
