module Carto
  module Api
    class DbdirectIpsController < ::Api::ApplicationController
      extend Carto::DefaultRescueFroms

      ssl_required :show, :update, :destroy

      before_action :load_user
      before_action :check_permissions

      setup_default_rescues

      def show
        ips = @user.dbdirect_effective_ips
        render_jsonp({ ips: ips }, 200)
      end

      def update
        @user.dbdirect_effective_ips = params[:ips]
        @user.save!
        render_jsonp({ ips: @user.reload.dbdirect_effective_ips }, 201)
      end

      def destroy
        @user.dbdirect_effective_ips = nil
        @user.save!
        head :no_content
      end

      private

      def load_user
        @user = Carto::User.find(current_viewer.id)
      end

      def check_permissions
        # TODO: should the user be an organization owner?
        api_key = Carto::ApiKey.find_by_token(params["api_key"])
        if api_key.present?
          raise UnauthorizedError unless api_key.master?
          raise UnauthorizedError unless api_key.user_id == @user.id
        end
        unless @user.has_feature_flag?('dbdirect')
          raise UnauthorizedError.new("DBDirect not enabled for user #{@user.username}")
        end
      end
    end
  end
end
