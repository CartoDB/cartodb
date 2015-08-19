Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE synchronizations ALTER COLUMN modified_at TYPE timestamp with time zone
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE synchronizations ALTER COLUMN modified_at TYPE timestamp without time zone
    })
  end
end
