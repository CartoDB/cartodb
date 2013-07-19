# encoding: utf-8
require_relative '../../../app/models/visualization/table_blender'

include CartoDB::Visualization

describe TableBlender do
  describe '#blend' do
    it 'returns a map with layers from the passed tables' do
      pending
    end
  end #blend

  describe '#blended_privacy' do
    it 'returns private if any of all tables is private' do
      user   = Object.new
      tables = [fake_public_table, fake_private_table]
      TableBlender.new(user, tables).blended_privacy.should == 'private'

      tables = [fake_private_table, fake_public_table]
      TableBlender.new(user, tables).blended_privacy.should == 'private'
    end

    it 'returns public if all tables are public' do
      user   = Object.new
      tables = [fake_public_table, fake_public_table]

      TableBlender.new(user, tables).blended_privacy.should == 'public'
    end
  end #blended_privacy


  def fake_public_table
    table = Object.new
    def table.privacy_text; 'PUBLIC'; end
    table
  end #fake_public_table

  def fake_private_table
    table = Object.new
    def table.privacy_text; 'PRIVATE'; end
    table
  end #fake_private_table
end # TableBlender

