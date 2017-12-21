Sequel.migration do
  up do
    SequelRails.connection.run(%{
      ALTER TABLE visualization_exports alter column user_id drop not null;
    })
  end

  down do
    # This is the symmetric action, but it's not safe (there could be null `user_id`s)
    # and it's not needed for `up` to be safe (`up` code is idempotent).
    #
    # SequelRails.connection.run(%{
    #   ALTER TABLE visualization_exports alter column user_id set not null;
    # })
  end
end
