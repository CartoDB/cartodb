# encoding: utf-8

require_dependency 'cartodb/errors'

module Carto
  module Api

    # Group metadata registration. Exclusively for usage from PostgreSQL Extension, not from the Editor.
    # It only registers metadata, actual group roles management must be done by the extension.
    # Named "DatabaseGroups" because it receives _databases_, not organizations.
    class DatabaseGroupsController < ::ApplicationController

      respond_to :json

      ssl_required :create, :update, :destroy, :add_users, :remove_users, :update_permission, :destroy_permission

      # TODO: Make this controller inherit from ::Api::ApplicationController and remove skip_before_filter bellow
      skip_before_filter :verify_authenticity_token

      # Allow HTTPS on local/test as the calls from the groups API are done sending a https X-Forwarded-Proto,
      #  like simulating they come from https:
      # @see https://github.com/CartoDB/cartodb-postgresql/blob/bce61c1e4359653134134097d269edae581e5660/scripts-available/CDB_Groups_API.sql#L170
      # Without it, SSL is forbidden and a 302 to url "without HTTP" was returned so the API didn't work on testing

      def ssl_allowed?
        Rails.env.development? || Rails.env.test?
      end

      before_filter :authenticate_extension
      before_filter :load_parameters
      before_filter :load_mandatory_group, :only => [:destroy, :add_users, :remove_users, :update_permission, :destroy_permission]
      before_filter :load_user_from_username, :only => [:load_table, :update_permission, :destroy_permission]
      before_filter :load_users_from_username, :only => [:add_users, :remove_users]
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
        render json: {}, status: 204
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      def add_users
        added_usernames = []
        @usernames.map { |username|
          begin
            added_usernames << @group.add_user(username).user.username
          rescue CartoDB::ModelAlreadyExistsError => e
            # This will provoke 409 response later
          end
        }
        if added_usernames.length == @usernames.length
          render json: { users: added_usernames }, status: 200
        else
          render json: { errors: "Some users were already in the group: #{@usernames - added_usernames }", users: added_usernames }, status: 409
        end
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 500
      end

      def remove_users
        removed_usernames = []
        @usernames.map { |username|
          removed_user = @group.remove_user(username)
          removed_usernames << removed_user.username if !removed_user.nil?
        }
        if removed_usernames.length == @usernames.length
          render json: { users: removed_usernames }, status: 200
        else
          render json: { errors: "Some users (#{@usernames - removed_usernames}) were not in the group", users: removed_usernames }, status: 404
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

      def authenticate_extension
        raise "missing org_metadata_api configuration" unless Cartodb.config[:org_metadata_api]

        authenticate_or_request_with_http_basic do |username, password|
          username == Cartodb.config[:org_metadata_api]["username"] && password == Cartodb.config[:org_metadata_api]["password"]
        end
      end

      def load_parameters
        @database_name = params[:database_name]
        @name = [params[:old_name], params[:name]].compact.first
        @database_role = params[:database_role]
        @username = params[:username]
        @usernames = @username.present? ? [ @username ] : params[:users]
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

      def load_users_from_username
        @users = @usernames.map { |username| Carto::User.where(username: username).first }
      end

      def load_table
        @table = Carto::Visualization.where(user_id: @user.id, type: 'table', name: @table_name).first
        render json: { errors: "Table #{@username}.#{@table_name} not found" }, status: 404 unless @table
      end

    end
  end
end
