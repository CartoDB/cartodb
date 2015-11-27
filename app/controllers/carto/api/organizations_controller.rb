# encoding: utf-8

require_relative './user_presenter'

module Carto
  module Api
    class OrganizationsController < ::Api::ApplicationController
      include PagedSearcher

      ssl_required :users

      before_filter :load_organization, :load_group

      def users
        page, per_page, order = page_per_page_order_params(50, :username)
        query = params[:q]
        users_query = [@group, @organization].compact.first.users
        users_query = users_query.where('(username like ? or email like ?)', "%#{query}%", "#{query}") if query

        total_user_entries = users_query.count
        users_query = users_query.offset(( page - 1 ) * per_page ).limit(per_page).order(order)
        users = users_query.all

        render_jsonp({ users: users.map { |u|
          Carto::Api::UserPresenter.new(u).to_poro
        }, total_user_entries: total_user_entries, total_entries: users.count })
      end

      def load_organization
        @organization = Carto::Organization.where(id: params[:id]).first
        render_jsonp({}, 401) and return if @organization.nil?
      end

      def load_group
        if params[:group_id]
          @group = @organization.groups.find(params[:group_id])
          render_jsonp({ errors: "No #{params[:group_id]} at #{@organization.id}" }, 404) and return unless @group
        end
      end

    end
  end
end
