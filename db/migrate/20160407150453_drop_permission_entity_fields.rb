Sequel.migration do
  up do
    alter_table(:permissions) do
      drop_column :entity_id
      drop_column :entity_type
    end
  end

  down do
    alter_table(:permissions) do
      add_column :entity_id, :uuid
      add_column :entity_type, :text
    end
    Rails::Sequel.connection.run(%{
      UPDATE permissions SET entity_id = visualizations.id, entity_type = 'vis'
      FROM visualizations
      WHERE permissions.id = visualizations.permission_id })
    Rails::Sequel.connection.run('DELETE FROM permissions WHERE entity_id IS NULL')
    alter_table(:permissions) do
      set_column_not_null(:entity_id)
      set_column_not_null(:entity_type)
    end
  end
end
