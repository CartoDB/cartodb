module Carto
  module Api
    class StatePresenter
      def initialize(state)
        @state = state
      end

      def self.present_collection(states)
        states.map do |state|
          StatePresenter.new(state).to_hash
        end
      end

      def to_hash
        {
          id: @state.id,
          created_at: @state.created_at,
          updated_at: @state.updated_at,
          json: @state.json,
          user: Carto::Api::UserPresenter.new(@state.user).to_public_poro
        }
      end
    end
  end
end
