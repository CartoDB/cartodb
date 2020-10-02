Sequel.migration do
  up do
    SequelRails.connection.run(%{
      ALTER TABLE maps ALTER COLUMN scrollwheel SET DEFAULT false;
    })
  end

  down do
    SequelRails.connection.run(%{
      ALTER TABLE maps ALTER COLUMN scrollwheel SET DEFAULT true;
    })
  end
end
