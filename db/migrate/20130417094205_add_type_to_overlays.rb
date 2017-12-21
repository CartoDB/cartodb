Sequel.migration do
  change do
    alter_table :overlays do
      add_column :type, String
    end
  end
end

