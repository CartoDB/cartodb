Sequel.migration do
  change do
    alter_table :widgets do
      add_column :style, :json, null: false, default: '{}'
    end
  end
end
