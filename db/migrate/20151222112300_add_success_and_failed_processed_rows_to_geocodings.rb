Sequel.migration do
  up do
    alter_table(:geocodings) do
      add_column :successful_processed_rows, :bigint
      add_column :failed_processed_rows, :bigint
      add_column :empty_processed_rows, :bigint
    end
  end

  down do
    alter_table(:geocodings) do
      drop_column :successful_processed_rows
      drop_column :failed_processed_rows
      drop_column :empty_processed_rows
    end
  end
end
