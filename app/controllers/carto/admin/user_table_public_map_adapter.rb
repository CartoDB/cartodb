
module Carto
  module Admin
    class UserTablePublicMapAdapter
      extend Forwardable

      delegate [:dependent_visualizations, :partially_dependent_visualizations,
                :fully_dependent_visualizations, :name, :id] => :user_table

      attr_reader :user_table

      def initialize(user_table)
        @user_table = user_table
      end

    end
  end
end
