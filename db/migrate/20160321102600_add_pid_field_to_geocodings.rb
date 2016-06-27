Sequel.migration do
  up do
    alter_table(:geocodings) do
      add_column :pid, :text
    end
  end

  down do
    alter_table(:geocodings) do
      drop_column :pid
    end
  end
end
