# encoding: utf-8
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require_relative '../../spec_helper'

describe CartoDB::ColumnTypecaster do
  before do
    quota_in_bytes  = 524288000
    table_quota     = 500
    @user           = create_user(
                        quota_in_bytes: quota_in_bytes,
                        table_quota:    table_quota
                      )
  end

  after do
    @user.destroy
  end

  pending 'raises NonConvertibleData when trying to cast a non-supported time format to date' do
    @user.in_database { |database| @db = database }

    table_name  = "test_#{rand(999)}"
    schema      = @user.database_schema
    dataset     = @db[table_name.to_sym]
    time_text   = 'Mon Oct 13 1997 15:32:18 GMT+0200 (CEST)'

    @db.create_table?(table_name) do
      String  :time_with_timezone
    end

    5.times { dataset.insert(time_with_timezone: time_text) }

    typecaster  = CartoDB::ColumnTypecaster.new(
      user_database:  @db,
      schema:         schema,
      table_name:     table_name,
      column_name:    :time_with_timezone,
      new_type:       'date'
    )

    expect { typecaster.run }.to raise_error CartoDB::NonConvertibleData
    dataset.first.fetch(:time_with_timezone).should_not be_nil

    @db.drop_table?(table_name)
  end
end

