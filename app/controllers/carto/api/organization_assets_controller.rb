# encoding: utf-8

require 'carto/organization_asset_file'

module Carto
  module Api
    class OrganizationAssetsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :destroy

      before_filter :load_organization,
                    :organization_members_only
      before_filter :organization_owners_only, only: [:create, :destroy]
      before_filter :load_asset, only: [:show, :destroy]
      before_filter :load_asset_file, only: :create

      rescue_from LoadError,
                  UnprocesableEntityError,
                  UnauthorizedError, with: :rescue_from_carto_error

      def index
        presentation = AssetPresenter.collection_to_hash(@organization.assets)

        render json: presentation
      end

      def show
        render json: AssetPresenter.new(@asset).to_hash
      end

      def create
        asset = Asset.create!(kind: params[:kind],
                              organization_id: @organization.id,
                              public_url: @asset_file.url,
                              storage_info: @asset_file.storage_info)

        render json: AssetPresenter.new(asset), status: :created
      rescue ActiveRecord::RecordInvalid => exception
        message = exception.record.errors.full_messages.join(', ')
        raise UnprocesableEntityError.new(message)
      end

      def destroy
        @asset.destroy

        head :no_content
      end

      private

      def load_organization
        @organization = Organization.find(params[:organization_id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Organization not found')
      end

      def organization_members_only
        raise UnauthorizedError.new unless @organization.member?(current_viewer)
      end

      def organization_owners_only
        raise UnauthorizedError.new unless @organization.owner?(current_viewer)
      end

      def load_asset
        @asset = Asset.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Asset not found')
      end

      def load_asset_file
        @resource = params[:resource]
        unless @resource.present?
          raise UnprocesableEntityError.new('Missing resource for asset')
        end

        @asset_file = OrganizationAssetFile.new(@organization, @resource)
        unless @asset_file.valid?
          raise UnprocesableEntityError.new(@asset_file.errors)
        end
      end
    end
  end
end
