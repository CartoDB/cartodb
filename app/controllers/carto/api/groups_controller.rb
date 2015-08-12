# encoding: utf-8

module Carto
  module Api
    class GroupsController < Superadmin::SuperadminController

      respond_to :json

      ssl_required :create unless Rails.env.development? || Rails.env.test?

      def create
        database_name = params[:database_name]
        name = params[:name]
        group = Group.new_instance(database_name, name)
        group.save
        render json: group.to_json
      rescue => e
        CartoDB.notify_exception(e, { params: params , group: (group ? group: 'not created') })
        render json: { errors: e.message }, status: 400
      end

    end
  end
end
