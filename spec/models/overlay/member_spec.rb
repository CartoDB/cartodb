# encoding: utf-8
require_relative '../../../app/models/overlay/member'
require_relative '../../../services/data-repository/repository'

include CartoDB
describe Overlay::Member do
  before do
    Overlay.repository = DataRepository.new
  end

  describe '#initialize' do
    it 'sets the id by default' do
      Overlay::Member.new.id.should_not be_nil
    end
  end #initialize

  describe '#store' do
    it 'persists attributes to the data repository' do
      member = Overlay::Member.new(type: 'bogus')
      member.store

      member = Overlay::Member.new(id: member.id)
      member.type.should be_nil

      member.fetch
      member.type.should == 'bogus'
    end
  end #store

  describe '#fetch' do
    it 'fetches attributes from the data repository' do
      member = Overlay::Member.new(type: 'bogus')
      member.store

      member = Overlay::Member.new(id: member.id)
      member.fetch
      member.type.should == 'bogus'
    end
  end #fetch

  describe '#delete' do
    it 'deletes this member data from the data repository' do
      member = Overlay::Member.new(type: 'bogus')
      member.store

      member.fetch
      member.type.should_not be_nil

      member.delete
      member.type.should be_nil

      lambda { member.fetch }.should raise_error KeyError
    end
  end #delete
end # Overlay::Member
