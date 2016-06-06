module Carto
  class UserTableIndexService
    def initialize(user_table)
      @user_table = user_table
    end

    private

    def widgets
      @user_table.layers.map(&:widgets).flatten
    end

    def visualizations
      @user_table.layers.map(&:maps).flatten.map(&:visualizations).map(&:first)
    end
  end
end
