# coding: UTF-8

require_relative '../spec_helper'

include CartoDB

describe CartoDB::Permission do

  describe '#create' do
    it 'tests basic creation' do
      owner = 'wadus'
      acl = []

      permission = Permission.new(
          owner: owner
          #check default acl is correct
      )
      permission.save

      permission.id.should_not eq nil
      permission.owner.should eq owner
      permission.acl.should eq acl

    end
  end

end
