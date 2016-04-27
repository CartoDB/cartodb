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
      # INFO: we're not creating but registering an existent table, so we want fixed, known name
      table.instance_eval { self[:name] = table_name }
      table.migrate_existing_table  = table_name
      table.data_import_id  = data_import_id
      set_metadata_from_data_import_id(table, data_import_id)
      table.save
      table.optimize
      table.map.recalculate_bounds!
    end

    def exists?(user, table_name)
      !table_klass.where(user_id: user.id, name: table_name).empty?
    end

    def get_valid_table_name(table_name)
      # table_klass.get_valid_table_name(table_name, {
      #     connection: user.in_database,
      #     database_schema: user.database_schema
      #   })

      table_klass.new_get_valid_table_name(table_name, user)
    end

    attr_reader :user, :table

    private

    attr_reader :table_klass
    attr_writer :table

    def set_metadata_from_data_import_id(table, data_import_id)
      external_data_import = ExternalDataImport.where(data_import_id: data_import_id).first
      if external_data_import
        external_source = CartoDB::Visualization::ExternalSource.where(id: external_data_import.external_source_id).first
        if external_source
          visualization = external_source.visualization
          if visualization
            table.description = visualization.description
            table.set_tag_array(visualization.tags)
          end
        end
      end
    rescue => e
      CartoDB.notify_exception(e)
      raise e
    end
  end # TableRegistrar
end # CartoDB
