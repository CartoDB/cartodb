Sequel.migration do
  up do
    alter_table(:widgets) do
      add_column :source_id, :text
    end
  end

  down do
    alter_table(:widgets) do
      drop_column :source_id
    end
  end
end
