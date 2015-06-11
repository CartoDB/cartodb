
module Carto
  module Admin
    class UserTablePublicMapAdapter
      extend Forwardable

      delegate [ :non_dependent_visualizations, :dependent_visualizations, :name, :id ] => :user_table

      attr_reader :user_table

      def initialize(user_table)
        @user_table = user_table
      end

    end
  end
end
