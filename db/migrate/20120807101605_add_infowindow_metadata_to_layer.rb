Sequel.migration do
  change do
    alter_table :layers do
      add_column :infowindow, :text
    end
  end
end
