# encoding: UTF-8
require_relative 'user_creation_presenter'

module Carto
  module Api
    class UserCreationsController < ::Api::ApplicationController

      skip_before_filter :api_authorization_required

      ssl_required :show

      before_filter :load_user_creation, only: :show

      def show
        render_jsonp(UserCreationPresenter.new(@user_creation).to_poro)
      end

      private

      def load_user_creation
        @user_creation = Carto::UserCreation.where(id: params[:id]).first
        render_404 and return false unless @user_creation
      end

    end
  end
end
