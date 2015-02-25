Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_table_row_count TYPE bigint
    })
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_file_size TYPE bigint
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_table_row_count TYPE int
    })
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_file_size TYPE int
    })
  end
end
