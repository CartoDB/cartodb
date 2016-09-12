Sequel.migration do
  up do
    Rails::Sequel.connection.run(%{
        ALTER TABLE visualizations
          DROP CONSTRAINT visualizations_state_id_fkey;

        ALTER TABLE visualizations
          ADD CONSTRAINT visualizations_state_id_fkey
            FOREIGN KEY (state_id)
            REFERENCES states(id)
            ON DELETE SET NULL; })
  end

  down do
    Rails::Sequel.connection.run(%{
        ALTER TABLE visualizations
          DROP CONSTRAINT visualizations_state_id_fkey;

        ALTER TABLE visualizations
          ADD CONSTRAINT visualizations_state_id_fkey
            FOREIGN KEY (state_id)
            REFERENCES states(id); })
  end
end
