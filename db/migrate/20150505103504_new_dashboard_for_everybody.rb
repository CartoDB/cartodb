class NewDashboardForEverybody < Sequel::Migration

  def up
    # WARNING: this migration was buggy and therefore is deprecated.
    # It cannot be simply deleted because it would affect instances that already
    # run this migration.
  end

end
