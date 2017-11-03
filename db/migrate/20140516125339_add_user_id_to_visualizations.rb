Sequel.migration do
  up do
    add_column :visualizations, :user_id, :uuid

    SequelRails.connection.transaction do
      SequelRails.connection.run(%Q{
        UPDATE visualizations
        SET user_id = maps.user_id FROM maps
        WHERE maps.user_id IN (SELECT users.id FROM users)
        AND visualizations.user_id IS NULL
        AND visualizations.map_id = maps.id
      })
    end
  end

  down do
    drop_column :visualizations, :user_id
  end
end
