# encoding: utf-8

module Carto
  module Api
    class GroupsController < Superadmin::SuperadminController

      respond_to :json

      ssl_required :create unless Rails.env.development? || Rails.env.test?

      before_filter :load_parameters, :only => [:create, :destroy]
      before_filter :load_group_from_loaded_parameters, :only => [:destroy]

      def create
        group = Group.new_instance(@database_name, @name, @database_role)
        group.save
        render json: group.to_json
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

      private

      def load_parameters
        @database_name = params[:database_name]
        @name = params[:name]
        @database_role = params[:database_role]
      end

      def load_group_from_loaded_parameters
        @group = Group.where(organization_id: Organization.find_by_database_name(@database_name).id, name: @name).first
      end
    end
  end
end
