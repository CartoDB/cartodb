require 'spec_helper_unit'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/overlays'

describe 'cartodb:fix_unique_overlays' do
  before(:each) do
    Rake.application.rake_require "tasks/fix_unique_overlays"
    Rake::Task.define_task(:environment)

    member = Visualization::Member.new
    @visualization = member
  end

  it 'deletes duplicate overlays of unique type' do
    Visualization::Overlays.new(@visualization).create_default_overlays
    dup_overlay = Carto::Overlay.new(visualization_id: @visualization.id, type: 'logo')
    dup_overlay.save(validate: false)
    dup_overlay = Carto::Overlay.new(visualization_id: @visualization.id, type: 'logo')
    dup_overlay.save(validate: false)

    @visualization.overlays.select { |o| o.type == 'logo' }.count.should eq 3

    Rake.application['cartodb:fix_unique_overlays'].invoke

    @visualization.overlays.select { |o| o.type == 'logo' }.count.should eq 1
  end
end
