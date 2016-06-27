module TableMockHelper
  # Returns a fake ::Table instance that doesn't need an actual table
  # It also mocks the needed methods of map and user table, including
  # PermissionManager instatiation.
  def table_mock(schema: 'schema',
                 is_raster: false,
                 user_table: ::UserTable.new,
                 map: mock,
                 table_privacy_manager: mock)
    map.stubs(:recalculate_bounds!).returns(true)

    # user_table is not a mock because there's a circular reference
    # at Table constructor.
    table = ::Table.new(user_table: user_table)

    table.stubs(:map).returns(map)
    table.stubs(:import_to_cartodb).returns(true)
    table.stubs(:set_the_geom_column!).returns(true)
    table.stubs(:import_cleanup).returns(true)
    table.stubs(:cartodbfy).returns(true)
    table.stubs(:schema).returns(schema)
    table.stubs(:is_raster?).returns(is_raster)
    table.stubs(:grant_select_to_tiler_user).returns(true)
    table.stubs(:update_cdb_tablemetadata).returns(true)

    table_privacy_manager.stubs(:apply_privacy_change).returns(true)
    CartoDB::TablePrivacyManager.stubs(:new).with(user_table).returns(table_privacy_manager)

    table
  end
end
