# encoding: utf-8
require 'rspec'
require_relative '../../spec_helper'

describe CartoDB::TableRelator do
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

  it 'checks row_count_and_size relator method' do
    @user.in_database { |database| @db = database }

    table_name  = "test_#{rand(999)}"

    table = create_table({
                             :user_id => @user.id,
                             name: table_name
                         })

    expected_data = { size: 16384 , row_count: 0}

    table.row_count_and_size.should eq expected_data

    @db.drop_table?(table_name)
  end
end

