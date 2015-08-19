# encoding: utf-8

require_dependency 'cartodb/errors'

module Carto
  module Api

    # Group metadata registration. Exclusively for usage from PostgreSQL Extension, not from the Editor.
    # It only registers metadata, actual group roles management must be done by the extension.
    class GroupsController < Superadmin::SuperadminController
      # TODO: not SuperadminController?

      respond_to :json

      ssl_required :create, :update, :destroy, :add_member, :remove_member, :update_permission, :destroy_permission unless Rails.env.development? || Rails.env.test?

      before_filter :load_parameters
      before_filter :load_mandatory_group, :only => [:destroy, :add_member, :remove_member, :update_permission, :destroy_permission]
      before_filter :load_user_from_username, :only => [:add_member, :remove_member, :load_table, :update_permission, :destroy_permission]
      before_filter :load_table, :only => [:update_permission, :destroy_permission]

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
        new_name = params['name']
        group = get_group_from_loaded_parameters
        if group
          group.rename(new_name, @database_role)
          if group.save
            render json: @group.to_json
          else
            raise "Error saving group: #{@group.errors}"
          end
        else
          renamed_group = get_group(@database_name, new_name)
          if renamed_group && renamed_group.database_role == @database_role
            CartoDB.notify_debug('Group already renamed', { params: params })
            render json: { errors: "That group has already been renamed" }, status: 409
          else
            raise "Group not found and no matching rename found"
          end
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

      def update_permission
        permission = CartoDB::Permission[@table.permission.id]
        permission.set_group_permission(@group, @access)
        permission.save
        render json: {}, status: 200
      rescue CartoDB::ModelAlreadyExistsError => e
        CartoDB.notify_debug('Permission already granted', { params: params })
        render json: { errors: "That permission is already granted" }, status: 409
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      def destroy_permission
        permission = CartoDB::Permission[@table.permission.id]
        permission.remove_group_permission(@group)
        permission.save
        render json: {}, status: 200
      rescue CartoDB::ModelAlreadyExistsError => e
        CartoDB.notify_debug('Permission already revoked', { params: params })
        render json: { errors: "That permission is already revoked" }, status: 404
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
        @table_name = params[:table_name]
        case params['access']
            when nil
            when 'r'
              @access = CartoDB::Permission::ACCESS_READONLY
            when 'w'
              @access = CartoDB::Permission::ACCESS_READWRITE
            else raise "Unknown access #{params['access']}"
            end
      end

      def get_group_from_loaded_parameters
        get_group(@database_name, @name)
      end

      def get_group(database_name, name)
        Group.where(organization_id: Organization.find_by_database_name(database_name).id, name: name).first
      end

      def load_mandatory_group
        @group = get_group_from_loaded_parameters
        render json: { errors: "Group with database_name #{@database_name} and name #{@name} not found" }, status: 404 unless @group
      end

      def load_user_from_username
        @user = Carto::User.where(username: @username).first
      end

      def load_table
        @table = Carto::Visualization.where(user_id: @user.id, name: @table_name).first
        render json: { errors: "Table #{@username}.#{@table_name} not found" }, status: 404 unless @table
      end

    end
  end
end
