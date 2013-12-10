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
      table.table_id                = oid_from(table_name)
      table.migrate_existing_table  = table_name
      table.data_import_id          = data_import_id
      table.save
      table.optimize
      table.map.recalculate_bounds!
    rescue => exception
      puts exception.to_s
      puts exception.backtrace.join("\n")
    end

    def exists?(user, table_name)
      user.tables.map(&:name).include?(table_name)
    end 

    def oid_from(table_name)
      user.in_database[
        "SELECT '#{table_name}'::regclass::oid"
      ].first.fetch(:oid)
    end

    def get_valid_table_name(table_name)
      table_klass.get_valid_table_name(
        table_name, name_candidates: user.reload.taken_table_names
      )
    end

    attr_reader :user, :table

    private

    attr_reader :table_klass
    attr_writer :table
  end # TableRegistrar
end # CartoDB

