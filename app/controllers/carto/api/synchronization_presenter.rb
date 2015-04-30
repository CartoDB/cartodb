
module Carto
  module Api
    class SynchronizationPresenter

      def initialize(synchronization)
        @synchronization = synchronization
      end

      def to_poro
        # TODO
        @synchronization.nil? ? nil : {}
      end

    end
  end
end
