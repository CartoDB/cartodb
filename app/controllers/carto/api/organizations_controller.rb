require_relative './user_presenter'

module Carto
  module Api
    class OrganizationsController < ::Api::ApplicationController
      include OrganizationsHelper
      include PagedSearcher

      ssl_required :users

      before_filter :load_organization, :load_group

      rescue_from Carto::ParamInvalidError, with: :rescue_from_carto_error

      VALID_ORDER_PARAMS = [:username, :updated_at].freeze

      def users
        page, per_page, order, = page_per_page_order_params(VALID_ORDER_PARAMS, default_per_page: 50,
                                                                                default_order: :username)
        query = params[:q]
        users_query = [@group, @organization].compact.first.users
        users_query = users_query.where('(username like ? or email like ?)', "%#{query}%", "#{query}") if query

        total_user_entries = users_query.count
        users_query = users_query.offset(( page - 1 ) * per_page ).limit(per_page).order(order)
        users = users_query.all

        render_jsonp({ users: users.map { |u|
          Carto::Api::UserPresenter.new(u, current_viewer: current_user, fetch_db_size: false).to_poro
        }, total_user_entries: total_user_entries, total_entries: users.count })
      end
    end
  end
end
