Sequel.migration do
  up do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE maps ALTER COLUMN scrollwheel SET DEFAULT false;
    })
  end

  down do
    Rails::Sequel.connection.run(%Q{
      ALTER TABLE maps ALTER COLUMN scrollwheel SET DEFAULT true;
    })
  end
end
