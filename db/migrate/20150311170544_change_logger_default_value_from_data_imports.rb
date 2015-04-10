Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE data_imports ALTER COLUMN logger DROP NOT NULL
    })
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE data_imports ALTER COLUMN logger DROP DEFAULT
    })
  end

  down do
  end
end