Sequel.migration do
  up do
    alter_table :visualizations do
      add_column :display_name, :text
    end
  end

  down do
    alter_table :visualizations do
      drop_column :display_name
    end
  end
end
