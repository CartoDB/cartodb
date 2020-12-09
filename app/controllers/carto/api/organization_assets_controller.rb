module Carto
  module Api
    class OrganizationAssetsController < ::Api::ApplicationController
      ssl_required :index, :show, :create, :destroy

      before_filter :load_organization,
                    :organization_members_only
      before_filter :organization_owners_only, only: [:create, :destroy]
      before_filter :load_asset, only: [:show, :destroy]
      before_filter :load_resource, only: :create

      rescue_from LoadError,
                  UnprocesableEntityError,
                  UnauthorizedError, with: :rescue_from_carto_error

      def index
        presentation = @organization.assets.map do |asset|
          AssetPresenter.new(asset).to_hash
        end

        render json: presentation
      end

      def show
        render json: AssetPresenter.new(@asset).to_hash
      end

      def create
        asset = Asset.for_organization(organization: @organization,
                                       resource: @resource)

        asset.save!
        render json: AssetPresenter.new(asset), status: :created
      rescue ActiveRecord::RecordInvalid => exception
        raise UnprocesableEntityError.with_full_messages(exception)
      end

      def destroy
        @asset.destroy

        head :no_content
      end

      private

      def load_organization
        @organization = Carto::Organization.find(params[:organization_id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Organization not found')
      end

      def organization_members_only
        unless current_viewer.belongs_to_organization?(@organization)
          raise UnauthorizedError.new
        end
      end

      def organization_owners_only
        raise UnauthorizedError.new unless @organization.owner?(current_viewer)
      end

      def load_asset
        @asset = Asset.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        raise LoadError.new('Asset not found')
      end

      def load_resource
        @resource = params[:resource]
        unless @resource.present?
          raise UnprocesableEntityError.new('Missing resource for asset')
        end
      end
    end
  end
end
