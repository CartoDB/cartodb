Sequel.migration do
  change do
    alter_table :overlays do
      add_column :template, String
    end
  end
end

