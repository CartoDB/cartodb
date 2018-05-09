# encoding: utf-8

require_relative 'paged_searcher'
require_dependency 'cartodb/errors'

module Carto
  module Api

    class GroupsController < ::Api::ApplicationController
      include PagedSearcher
      include Carto::ControllerHelper

      ssl_required :index, :show, :create, :update, :destroy, :add_users, :remove_users

      before_filter :load_fetching_options, only: [:show, :index]
      before_filter :load_organization
      before_filter :load_user
      before_filter :validate_organization_or_user_loaded
      before_filter :load_group, only: [:show, :update, :destroy, :add_users, :remove_users]
      before_filter :org_admin_only, only: [:create, :update, :destroy, :add_users, :remove_users]
      before_filter :org_users_only, only: [:show, :index]
      before_filter :load_organization_users, only: [:add_users, :remove_users]
      before_filter :valid_password_confirmation, only: [:destroy, :add_users, :remove_users]

      rescue_from Carto::OrderParamInvalidError, with: :rescue_from_carto_error
      rescue_from Carto::PasswordConfirmationError, with: :rescue_from_password_confirmation_error

      VALID_ORDER_PARAMS = [:id, :name, :display_name, :organization_id, :updated_at].freeze

      def index
        page, per_page, order = page_per_page_order_params(VALID_ORDER_PARAMS)

        groups = @user ? @user.groups : @organization.groups
        groups = groups.where('name ilike ?', "%#{params[:q]}%") if params[:q]
        total_entries = groups.count

        groups = Carto::PagedModel.paged_association(groups, page, per_page, order)

        render_jsonp({
          groups: groups.map { |g| Carto::Api::GroupPresenter.new(g, @fetching_options).to_poro },
          total_entries: total_entries
        }, 200)
      end

      def show
        render_jsonp(Carto::Api::GroupPresenter.new(@group, @fetching_options).to_poro, 200)
      end

      def create
        group = @organization.create_group(params['display_name'])
        render_jsonp(Carto::Api::GroupPresenter.full(group).to_poro, 200)
      rescue CartoDB::ModelAlreadyExistsError => e
        CartoDB::Logger.debug(message: 'Group already exists', exception: e, params: params)
        render json: { errors: ["A group with that name already exists"] }, status: 409
      rescue ActiveRecord::StatementInvalid => e
        handle_statement_invalid_error(e, group)
      rescue => e
        CartoDB::Logger.error(exception: e, params: params, group: group || 'no group', organization: @organization)
        render json: { errors: [e.message] }, status: 500
      end

      def update
        @group.rename_group_with_extension(params['display_name'])
        render_jsonp(Carto::Api::GroupPresenter.full(@group).to_poro, 200)
      rescue CartoDB::ModelAlreadyExistsError => e
        CartoDB::Logger.debug(message: 'Group display name already exists', params: params)
        render json: { errors: ["A group with that name already exists"] }, status: 409
      rescue ActiveRecord::StatementInvalid => e
        handle_statement_invalid_error(e, @group)
      rescue => e
        CartoDB::Logger.error(exception: e, params: params, group: @group)
        render json: { errors: [e.message] }, status: 500
      end

      def destroy
        @group.destroy_group_with_extension
        render json: {}, status: 204
      rescue ActiveRecord::StatementInvalid => e
        handle_statement_invalid_error(e, @group)
      rescue => e
        CartoDB::Logger.error(exception: e, params: params, group: @group)
        render json: { errors: [e.message] }, status: 500
      end

      def add_users
        @group.add_users_with_extension(@organization_users)
        render json: {}, status: 200
      rescue ActiveRecord::StatementInvalid => e
        handle_statement_invalid_error(e, @group)
      rescue => e
        CartoDB::Logger.error(exception: e, user: @user, params: params, group: @group)
        render json: { errors: [e.message] }, status: 500
      end

      def remove_users
        @group.remove_users_with_extension(@organization_users)
        render json: {}, status: 200
      rescue ActiveRecord::StatementInvalid => e
        handle_statement_invalid_error(e, @group)
      rescue => e
        CartoDB::Logger.error(exception: e, user: @user, params: params, group: @group)
        render json: { errors: [e.message] }, status: 500
      end

      private

      def load_fetching_options
        @fetching_options = {
          fetch_shared_tables_count: params[:fetch_shared_tables_count] == 'true',
          fetch_shared_maps_count: params[:fetch_shared_maps_count] == 'true',
          fetch_users: params[:fetch_users] == 'true'
        }
      end

      def load_organization
        return unless params['organization_id'].present?
        @organization = Carto::Organization.where(id: params['organization_id']).first
        render json: { errors: ["Org. #{params['organization_id']} not found"] }, status: 404 unless @organization
      end

      def load_user
        return unless params['user_id'].present?

        @user = Carto::User.where(id: params['user_id']).first
        render json: { errors: ["User #{params['user_id']} not found"] }, status: 404 unless @user

        if @organization.nil?
          @organization = @user.organization
        elsif @user.organization_id != @organization.id
          render json: { errors: ["You can't get other organization users"] }, status: 501
        end

        unless @user.id == current_user.id || current_user.organization_admin?
          render json: { errors: ["You can't get other users groups"] }, status: 501
        end
      end

      def validate_organization_or_user_loaded
        render json: { errors: ["You must set user_id or organization_id"] }, status: 404 unless @organization || @user
      end

      def org_users_only
        unless @organization.id == current_user.organization_id
          render json: { errors: ["Not organization user"] }, status: 400
        end
      end

      def org_admin_only
        unless @organization.admin?(current_user)
          render json: { errors: ["Not org. admin"] }, status: 400
        end
      end

      def load_group
        @group = @organization.groups.where(id: params['group_id']).first
        render json: { errors: ["Group #{params['group_id']} not found"] }, status: 404 unless @group
      end

      def load_organization_users
        ids = params['users'].present? ? params['users'] : [ params['user_id'] ]
        @organization_users = ids.map { |id| @organization.users.where(id: id).first }
        render json: { errors: ["Users #{ids} not found"] }, status: 404 if @organization_users.empty?
      end

      def handle_statement_invalid_error(e, group)
        err_regexp = /ERROR:  (.*)\n/
        if e.message =~ err_regexp
          render json: { errors: [err_regexp.match(e.message)[1]] }, status: 422
        else
          CartoDB::Logger.error(exception: e, params: params, group: group || 'no group', organization: @organization)
          render json: { errors: [e.message] }, status: 500
        end
      end

      def rescue_from_password_confirmation_error(error)
        render_jsonp({ message: "Error modifying groups", errors: [error.message] }, 403)
      end
    end
  end
end
