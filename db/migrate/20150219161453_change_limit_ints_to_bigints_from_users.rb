Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_table_row_count TYPE bigint
    })
    SequelRails.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_file_size TYPE bigint
    })
  end

  down do
    SequelRails.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_table_row_count TYPE int
    })
    SequelRails.connection.run(%Q{
      ALTER TABLE users ALTER COLUMN max_import_file_size TYPE int
    })
  end
end
