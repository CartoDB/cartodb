Sequel.migration do
  up do
    alter_table(:geocodings) do
      add_column :geocoder_type, :text
    end
  end

  down do
    alter_table(:geocodings) do
      drop_column :geocoder_type
    end
  end
end
