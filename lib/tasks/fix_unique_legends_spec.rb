require 'spec_helper_min'
require 'rake'
require 'factories/carto_visualizations'

describe 'cartodb:fix_unique_legends' do
  include Carto::Factories::Visualizations

  before(:each) do
    Rake.application.rake_require "tasks/fix_unique_legends"
    Rake::Task.define_task(:environment)

    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    @layer = @visualization.layers.find(&:data_layer?)
    legend = Carto::Legend.create!(layer: @layer,
                            type: 'bubble',
                            definition: { color: '#abc' })
    legend2 = legend.dup
    @updated_at = legend2.updated_at = legend.updated_at - 1.minute
    legend2.save(validate: false)
  end

  it 'deletes duplicate legend of unique type' do
    @layer.reload.legends.count.should eq 2

    Rake.application['cartodb:fix_unique_legends'].invoke

    @layer.reload.legends.count.should eq 1
    @layer.reload.legends.first.updated_at.to_s.should eq @updated_at.to_s
  end
end
