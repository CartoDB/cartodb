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
          name: @grantable.name
        }
      end

    end

  end
end

