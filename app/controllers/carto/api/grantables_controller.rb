# encoding: utf-8

require_dependency 'cartodb/errors'

module Carto
  module Api

    class GrantablesController < ::Api::ApplicationController
      include PagedSearcher

      respond_to :json

      ssl_required :index unless Rails.env.development? || Rails.env.test?

      before_filter :load_organization

      def index
        page, per_page, order = page_per_page_order_params

        grantable_query = Carto::GrantableQueryBuilder.new(@organization)
        grantables = grantable_query.run(page, per_page)
        total_entries = grantable_query.count
        total_org_entries = grantable_query.count

        render_jsonp({
          grantables: grantables.map { |g| Carto::Api::GrantablePresenter.new(g).to_poro },
          total_entries: total_entries,
          total_org_entries: total_org_entries
        }, 200)
      rescue => e
        CartoDB.notify_exception(e, { params: params })
        render json: { errors: e.message }, status: 500
      end

      private

      def load_organization
        @organization = Carto::Organization.where(id: params['organization_id']).first
        render json: { errors: "Organization #{params['organization_id']} not found" }, status: 404 unless @organization
        render json: { errors: "You don't belong to organization #{params['organization_id']}" }, status: 400 unless current_user.organization_id == @organization.id
      end

    end

  end
end


