Sequel.migration do
  up do
    alter_table(:users) do
      add_column :mobile_xamarin,           :boolean, null: false, default: false
      add_column :mobile_custom_watermark,  :boolean, null: false, default: false
      add_column :mobile_offline_maps,      :boolean, null: false, default: false
      add_column :mobile_gis_extension,     :boolean, null: false, default: false
      add_column :mobile_max_open_users,    :integer, null: false, default: 0
      add_column :mobile_max_private_users, :integer, null: false, default: 0
    end
  end

  down do
    alter_table(:users) do
      drop_column :mobile_xamarin
      drop_column :mobile_custom_watermark
      drop_column :mobile_offline_maps
      drop_column :mobile_gis_extension
      drop_column :mobile_max_open_users
      drop_column :mobile_max_private_users
    end
  end
end
