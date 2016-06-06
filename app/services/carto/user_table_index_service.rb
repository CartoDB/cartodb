module Carto
  class UserTableIndexService
    def initialize(user_table)
      @user_table = user_table
    end

    private

    def table_widgets
      widgets.select do |w|
        node = w.analysis_node
        node && node.table_source?(@user_table.name)
      end
    end

    def widgets
      @user_table.layers.map(&:widgets).flatten
    end
  end
end
