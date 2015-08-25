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
          avatar_url: @grantable.avatar_url
        }
      end

    end

  end
end

