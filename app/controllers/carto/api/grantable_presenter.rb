# encoding: utf-8

module Carto
  module Api
    class GrantablePresenter

      def initialize(grantable)
        @grantable = grantable
      end

      def to_poro
        {
          id: @grantable.id,
          type: @grantable.type,
          name: @grantable.name,
          avatar_url: @grantable.avatar_url,
          model: model_presenter.to_poro
        }
      end

      private

      def model_presenter
        case @grantable.type
        when 'user'
          Carto::Api::UserPresenter.new(Carto::User.find(@grantable.id))
        when 'group'
          Carto::Api::GroupPresenter.new(Carto::Group.find(@grantable.id))
        else
          raise "Unknown grantable type #{@grantable.type}"
        end
      end

    end

  end
end

