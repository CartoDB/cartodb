require 'spec_helper_unit'
require 'factories/carto_visualizations'

describe 'cartodb:fix_unique_legends' do
  include Carto::Factories::Visualizations

  before(:each) do
    Rake.application.rake_require "tasks/fix_unique_legends"
    Rake::Task.define_task(:environment)
    Rake.application['cartodb:fix_unique_legends'].reenable

    user = create(:carto_user)
    _, _, _, visualization = create_full_visualization(user)
    @layer = visualization.layers.find(&:data_layer?)
    @legend = Carto::Legend.create!(layer: @layer,
                                    title: "bird_name",
                                    pre_html: "",
                                    post_html: "",
                                    type: "torque",
                                    definition: {
                                      "categories" => [
                                        { "title" => "Perico", "color"=>"#ff382a", "icon"=>"" },
                                        { "title" => "Palotes", "color"=>"#0038d1", "icon"=>"" },
                                        { "title" => "Jr", "color"=>"#d4cf34", "icon"=>"" }
                                      ]
                                    },
                                    conf: { "columns" => [] })
  end

  it 'deletes duplicate legend of unique type' do
    legend2 = @legend.dup
    legend2.type = 'choropleth'
    legend2.updated_at = @legend.updated_at - 1.minute
    legend2.save(validate: false)
    @layer.reload.legends.count.should eq 2

    Rake.application['cartodb:fix_unique_legends'].invoke

    @layer.reload.legends.count.should eq 1
    @layer.reload.legends.first.id.should eq @legend.id
  end

  it 'keeps layers if different type' do
    legend2 = @legend.dup
    legend2.type = 'bubble'
    legend2.save(validate: false)
    @layer.reload.legends.count.should eq 2

    Rake.application['cartodb:fix_unique_legends'].invoke

    @layer.reload.legends.count.should eq 2
  end
end
