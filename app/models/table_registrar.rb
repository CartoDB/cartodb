# encoding: utf-8

module CartoDB
  class TableRegistrar
    def initialize(user, table_klass=nil)
      @user         = user
      @table_klass  = table_klass
    end

    def register(table_name, data_import_id)
      self.table                    = table_klass.new
      table.user_id                 = user.id
      table.name                    = table_name
      table.migrate_existing_table  = table_name
      table.data_import_id          = data_import_id
      table.save
      table.optimize
      table.map.recalculate_bounds!
    end

    def exists?(user, table_name)
      !table_klass.where(user_id: user.id, name: table_name).empty?
    end 

    def get_valid_table_name(table_name)
      table_klass.get_valid_table_name(
        table_name, 
        name_candidates: user.reload.tables.map(&:name)
      )
    end

    attr_reader :user, :table

    private

    attr_reader :table_klass
    attr_writer :table
  end # TableRegistrar
end # CartoDB

