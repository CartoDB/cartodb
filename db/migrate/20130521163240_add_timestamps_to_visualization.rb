Sequel.migration do
  change do
    alter_table :visualizations do
      set_column_default :created_at, Sequel::CURRENT_TIMESTAMP
      set_column_default :updated_at, Sequel::CURRENT_TIMESTAMP
      add_column :created_at, DateTime
      add_column :updated_at, DateTime
    end
  end
end

