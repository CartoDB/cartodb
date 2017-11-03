Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      ALTER TABLE data_imports ALTER COLUMN logger DROP NOT NULL
    })
    SequelRails.connection.run(%Q{
      ALTER TABLE data_imports ALTER COLUMN logger DROP DEFAULT
    })
  end

  down do
  end
end