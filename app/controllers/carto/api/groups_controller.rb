# encoding: utf-8

module Carto
  module Api
    class GroupsController < Superadmin::SuperadminController
      # TODO: not SuperadminController

      respond_to :json

      ssl_required :create unless Rails.env.development? || Rails.env.test?

      before_filter :load_parameters
      before_filter :load_group_from_loaded_parameters, :only => [:destroy, :add_member, :remove_member]
      before_filter :load_user_from_username, :only => [:add_member, :remove_member]

      def create
        group = Group.new_instance(@database_name, @name, @database_role)
        if group.save
          render json: group.to_json
        else
          render json: { errors: "Error saving group: #{group.errors}" }, status: 400
        end
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (group ? group : 'not created') })
        render json: { errors: e.message }, status: 400
      end

      def destroy
        @group.destroy
        render json: {}, status: 200
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 400
      end

      def add_member
        @group.add_member(@username)
        render json: {}, status: 200
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 400
      end

      def remove_member
        @group.remove_member(@username)
        render json: {}, status: 200
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (@group ? @group : 'not loaded') })
        render json: { errors: e.message }, status: 400
      end

      private

      def load_parameters
        @database_name = params[:database_name]
        @name = params[:name]
        @database_role = params[:database_role]
        @username = params[:username]
      end

      def load_group_from_loaded_parameters
        @group = Group.where(organization_id: Organization.find_by_database_name(@database_name).id, name: @name).first
      end

      def load_user_from_username
        @user = Carto::User.where(username: @username).first
      end

    end
  end
end
