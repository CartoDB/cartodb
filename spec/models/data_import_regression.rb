# encoding: utf-8
require_relative '../spec_helper'
require 'ruby-debug'

describe DataImport do
  before(:all) do
    ::User.all.each(&:destroy)
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @table = create_table :user_id => @user.id
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  folder = ENV['TEST_FILES'] || File.join(File.dirname(__FILE__), '../support/data/')
  Dir[folder + '/*'].each do |file|
  	it "imports #{file}" do
	    data_import = DataImport.create(
	      :user_id       => @user.id,
	      :data_source   => '/../'+Pathname.new(file).relative_path_from(Pathname.new(Rails.root.to_s)).to_s,
	      :updated_at    => Time.now
	    ).run_import!
	    table = Table[data_import.table_id]
	    table.should_not be_nil
  	end
  end
end
