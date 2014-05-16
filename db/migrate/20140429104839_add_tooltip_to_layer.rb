Sequel.migration do
  change do
    alter_table :layers do
      add_column :tooltip, :text
    end
  end
end
