# encoding: utf-8

require 'carto/storage'

module Carto
  module Api
    class OrganizationAssetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :destroy

      before_filter :load_organization,
                    :organization_owners_only
      before_filter :load_asset, only: [:show, :destroy]
      before_filter :load_file, only: :create

      rescue_from LoadError,
                  UnprocesableEntityError, with: :rescue_from_carto_error

      def index
        presentation = AssetPresenter.collection_to_hash(@organization.assets)

        render json: presentation
      end

      def show
        render json: AssetPresenter.new(@asset).to_hash
      end

      def create
        asset = Asset.create!(kind: params[:kind],
                              organization_id: @organization.id)

        remote_asset_location = File.join(Rails.env,
                                          'organization-assets',
                                          @organization.id,
                                          asset.id)

        public_url = Storage.instance.upload(remote_asset_location, @file)
        asset.update_attributes!(public_url: public_url)

        render json: AssetPresenter.new(asset), status: :created
      rescue ActiveRecord::RecordInvalid => exception
        message = exception.record.errors.full_messages.join(', ')
        raise UnprocesableEntityError.new(message)
      end

      def destroy
        @asset.destroy
      end

      private

      def load_organization
        @organization = Organization.find(params[:organization_id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Organization not found')
      end

      def organization_owners_only
        raise UnauthorizedError.new unless @organization.owner?(current_viewer)
      end

      def load_asset
        @asset = Organization.find(params[:asset_id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Asset not found')
      end

      def load_file
        url = params[:url]
        unless url.present?
          raise UnprocesableEntityError.new('Missing url for asset')
        end

        filename = current_viewer.id.to_s + Time.now.strftime("%Y%m%d%H%M%S")
        @file = Tempfile.new(filename)

        begin
          IO.copy_stream(open(url), @file)
        ensure
          @file.close
        end
      end
    end
  end
end
