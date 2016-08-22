# encoding utf-8

module Carto
  module Tracking
    class Format
      def initialize(hash)
        @hash = hash
      end

      def user
        Carto::User.find(@hash[:user_id])
      rescue ActiveRecord::RecordNotFound
        nil
      end

      def visualization
        Carto::Visualization.find(@hash[:visualization_id])
      rescue ActiveRecord::RecordNotFound
        nil
      end
    end
  end
end
