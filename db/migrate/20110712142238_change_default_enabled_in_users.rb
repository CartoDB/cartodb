class ChangeDefaultEnabledInUsersMigration < Sequel::Migration

  def up
    alter_table(:users) do
      set_column_default :enabled, true
    end
  end

  def down
    alter_table(:users) do
      set_column_default :enabled, false
    end
  end

end
