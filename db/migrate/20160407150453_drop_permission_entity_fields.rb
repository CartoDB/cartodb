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
    SequelRails.connection.run(%{
      UPDATE permissions SET entity_id = visualizations.id, entity_type = 'vis'
      FROM visualizations
      WHERE permissions.id = visualizations.permission_id })
  end
end
