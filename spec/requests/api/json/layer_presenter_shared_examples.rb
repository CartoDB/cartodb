# encoding: utf-8

shared_examples_for "layer presenters" do |tested_klass|

  describe '#show legacy tests' do

    before(:all) do
      set_tested_class(tested_klass)

      @user_1 = create_user(
        username: 'test',
        email:    'client@example.com',
        password: 'clientex'
      )
      @user_2 = create_user(
        username: 'test2',
        email:    'client2@example.com',
        password: 'clientex'
      )
    end

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
      delete_user_data @user_1
      delete_user_data @user_2
    end

    after(:all) do
      @user_1.destroy
      @user_2.destroy
    end

    def set_tested_class(klass)
      @klass = klass
      puts "Testing class  #{klass.to_s}"
    end

    def instance_of_tested_class(*args)
      @klass.new(*args)
    end

    it "Tests to_json()" do
      layer_1 = Layer.create({
          kind: 'tiled'
        })
      layer_2 = Layer.create({
          kind: 'carto',
          order: 13,
          options: { 
            'fake' => 'value',
            'table_name' => 'test_table'
            },
          infowindow: { 'fake2' => 'val2' },
          tooltip: { 'fake3' => 'val3' },
          parent_id: layer_1.id
        })

      presenter = instance_of_tested_class(layer_2)

      json_data = JSON.parse(presenter.to_json)

      json_data['id'].should == layer_2.id
      json_data['kind'].should == layer_2.kind
      json_data['order'].should == layer_2.order
      json_data['options'].should == layer_2.options
      json_data['infowindow'].should == layer_2.infowindow
      json_data['tooltip'].should == layer_2.tooltip
      json_data['parent_id'].should == layer_2.parent_id
      json_data['children'].should == layer_2.children

      presenter_options =  { 
          viewer_user: @user_2,
          user: @user_1
        }

      presenter = instance_of_tested_class(layer_2, presenter_options)

      json_data = JSON.parse(presenter.to_json)
      # to_json shouldn't change table_name even if viewer/user sent at presenter options
      json_data['options'].should == layer_2.options
    end

    it 'Tests to_poro()' do
      table_name = 'test_table'

      layer_1 = Layer.create({
          kind: 'tiled'
        })
      layer_2 = Layer.create({
          kind: 'carto',
          order: 13,
          options: { 
            'fake' => 'value',
            'table_name' => table_name
            },
          infowindow: { 'fake2' => 'val2' },
          tooltip: { 'fake3' => 'val3' },
          parent_id: layer_1.id
        })

      expected_poro = {
        'id' => layer_2.id,
        'kind' => 'carto',
        'order' => 13,
        'options' => { 
            'fake' => 'value',
            'table_name' => table_name
          },
        'infowindow' => { 
            'fake2' => 'val2' 
          },
        'tooltip' => { 
            'fake3' => 'val3' 
          },
        'parent_id' => layer_1.id,
        'children' => []
      }

      presenter = instance_of_tested_class(layer_2)

      poro = instance_of_tested_class(layer_2).to_poro

      poro.should == expected_poro

      # Now add presenter options to change table_name (new way)

      expected_poro['options']['table_name'] = "#{@user_1.database_schema}.#{table_name}"

      presenter_options =  { 
          viewer_user: @user_2,
          # New presenter way of sending a viewer that's different from the owner
          user: @user_1
        }

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      poro.should == expected_poro

      # old way

      layer_2.options = { 
            'fake' => 'value',
            'table_name' => table_name,
            # Old presenter way of sending a viewer
            'user_name' => @user_1.username
            }
      layer_2.save

      expected_poro = {
        'id' => layer_2.id,
        'kind' => 'carto',
        'order' => 13,
        'options' => { 
            'fake' => 'value',
            'table_name' => "#{@user_1.username}.#{table_name}",
            'user_name' => "#{@user_1.username}"
          },
        'infowindow' => { 
            'fake2' => 'val2' 
          },
        'tooltip' => { 
            'fake3' => 'val3' 
          },
        'parent_id' => layer_1.id,
        'children' => []
      }

      presenter_options =  {
          viewer_user: @user_2
        }

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      # Already changed to fully qualified expected table name, so no need to do it again
      poro.should == expected_poro

      # Finally, don't change if already has a fully qualified table_name

      layer_2.options = {
            'fake' => 'value',
            'table_name' => "fake.#{table_name}",
            # Old presenter way of sending a viewer
            'user_name' => @user_1.username
            }
      layer_2.save

      expected_poro['options']['table_name'] =  "fake.#{table_name}"

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      poro.should == expected_poro
    end

    it 'Tests to_vizjson_v1()' do
      layer_parent = Layer.create({
          kind: 'tiled'
        })

      layer = Layer.create({
          kind: 'carto',
          order: 5,
          options: { 
            'fake' => 'value',
            'table_name' => 'my_test_table',
            'opt1' => 'val1',
            },
          infowindow: { 
              'template' => nil,
              'fake2' => 'val2'
            },
          tooltip: { 'fake3' => 'val3' },
          parent_id: layer_parent.id
        })

      expected_vizjson = {
        id: layer.id,
        parent_id: layer.parent_id,
        children: [],
        kind: 'CartoDB',
        order: layer.order,
        infowindow: {
          'template' => nil,
          'fake2' => 'val2'
        },
        options: {
          'opt1' => 'val1'
        }
      }

      presenter_options =  {
      }

      presenter_configuration = {
        layer_opts: {
          'public_opts' => {
            'whatever' => true,
            'opt1' => true
          }
        }
      }

      vizjson = instance_of_tested_class(layer, presenter_options, presenter_configuration).to_vizjson_v1
      vizjson.should == expected_vizjson

      # Now full options

      presenter_options = {
        # Full options
        full: true
      }

      expected_vizjson[:options] = {
        'fake' => 'value',
        'table_name' => 'my_test_table',
        'opt1' => 'val1',
      }

      vizjson = instance_of_tested_class(layer, presenter_options, presenter_configuration).to_vizjson_v1
      vizjson.should == expected_vizjson

      # Now a base layer, which should be a poro with symbolized keys

      vizjson = instance_of_tested_class(layer_parent).to_vizjson_v1
      vizjson[:id].should == layer_parent.id
      vizjson[:kind].should == layer_parent.kind
    end

    it 'Tests to_vizjson_v2()' do
      layer_parent = Layer.create({
          kind: 'tiled'
        })

      # Base, which should be a poro but with symbols

      vizjson = instance_of_tested_class(layer_parent).to_vizjson_v2
      vizjson[:id].should == layer_parent.id
      vizjson[:kind].should == nil
      vizjson[:type].should == layer_parent.kind

    end

  end
end
