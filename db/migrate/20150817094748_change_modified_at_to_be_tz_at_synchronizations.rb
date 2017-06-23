Sequel.migration do
  up do
    SequelRails.connection.run(%Q{
      ALTER TABLE synchronizations ALTER COLUMN modified_at TYPE timestamp with time zone
    })
  end

  down do
    SequelRails.connection.run(%Q{
      ALTER TABLE synchronizations ALTER COLUMN modified_at TYPE timestamp without time zone
    })
  end
end
