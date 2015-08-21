module Carto
  module Api
    class GroupPresenter

      def initialize(group)
        @group = group
      end

      def to_poro
        {
          id: @group.id,
          organization_id: @group.organization_id,
          name: @group.name,
          display_name: @group.display_name
        }
      end

    end
  end
end
