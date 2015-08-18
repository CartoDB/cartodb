# encoding: utf-8

require_dependency 'cartodb/errors'

module Carto
  module Api
    class GroupsController < Superadmin::SuperadminController
      # TODO: not SuperadminController

      respond_to :json

      ssl_required :create, :update, :destroy, :add_member, :remove_member unless Rails.env.development? || Rails.env.test?

      before_filter :load_parameters
      before_filter :load_group_from_loaded_parameters, :only => [:update, :destroy, :add_member, :remove_member]
      before_filter :load_user_from_username, :only => [:update, :add_member, :remove_member]

      def create
        group = Group.new_instance(@database_name, @name, @database_role)
        if group.save
          render json: group.to_json
        else
          render json: { errors: "Error saving group: #{group.errors}" }, status: 400
        end
      rescue CartoDB::ModelAlreadyExistsError => e
        CartoDB.notify_debug('Group already exists', { params: params })
        render json: { errors: "A group with that data already exists" }, status: 409
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (group ? group : 'not created') })
        render json: { errors: e.message }, status: 500
      end

      def update
        @group.rename(params['name'], @database_role)
        if @group.save
          render json: @group.to_json
        else
          render json: { errors: "Error saving group: #{@group.errors}" }, status: 400
        end
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      def destroy
        @group.destroy
        render json: {}, status: 200
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      def add_member
        @group.add_member(@username)
        render json: {}, status: 200
      rescue CartoDB::ModelAlreadyExistsError => e
        CartoDB.notify_debug('Group member already exists', { params: params })
        render json: { errors: "That user is already in the group" }, status: 409
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      def remove_member
        removed = @group.remove_member(@username)
        if removed
          render json: {}, status: 200
        else
        CartoDB.notify_debug('Group member not in the group', { params: params })
        render json: { errors: "That user is not in the group" }, status: 404
        end
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      private

      def load_parameters
        @database_name = params[:database_name]
        @name = [params[:old_name], params[:name]].compact.first
        @database_role = params[:database_role]
        @username = params[:username]
      end

      def load_group_from_loaded_parameters
        @group = Group.where(organization_id: Organization.find_by_database_name(@database_name).id, name: @name).first
        render json: { errors: "Group with database_name #{@database_name} and name #{@name} not found" }, status: 404 unless @group
      end

      def load_user_from_username
        @user = Carto::User.where(username: @username).first
      end

    end
  end
end
