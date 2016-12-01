module Carto
  module Api
    class StatePresenter
      def initialize(state)
        @state = state
      end

      def to_hash
        {
          id: @state.id,
          visualization_id: @state.visualization_id,
          created_at: @state.created_at,
          updated_at: @state.updated_at,
          json: @state.json
        }
      end
    end
  end
end
