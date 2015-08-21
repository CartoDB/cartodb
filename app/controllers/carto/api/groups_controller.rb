# encoding: utf-8

require_relative 'paged_searcher'

module Carto
  module Api

    class GroupsController < ::Api::ApplicationController
      include PagedSearcher

      before_filter :load_organization

      def index
        page, per_page, order = page_per_page_order_params

        render_jsonp({
          groups: Carto::PagedModel.paged_association(@organization.groups, page, per_page, order).map { |g| Carto::Api::GroupPresenter.new(g).to_poro },
          total_entries: @organization.groups.count,
          total_org_entries: @organization.groups.count
        }, 200)
      end

      private

      def load_organization
        @organization = Carto::Organization.where(id: params['organization_id']).first
        render json: { errors: "Organization #{params['organization_id']} not found" }, status: 404 unless @organization
      end

    end
    
  end
end
