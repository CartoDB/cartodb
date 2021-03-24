shared_examples_for "layer presenters" do |tested_klass, model_klass|
  describe '#show legacy tests' do
    def set_tested_classes(tested_class, model_class)
      @tested_class = tested_class
      @model_class = model_class
    end

    def instance_of_tested_class(*args)
      @tested_class.new(*args)
    end

    # Always uses old models to created data, then battery set one for instantiation
    def instance_of_tested_model(creation_model)
      @model_class.where(id: creation_model.id).first
    end

    before do
      set_tested_classes(tested_klass, model_klass)
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      bypass_named_maps
      @user_1 = create(:valid_user)
      @user_2 = create(:valid_user)
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
          tooltip: { 'fake3' => 'val3' }
        })

      layer_2 = instance_of_tested_model(layer_2)
      presenter = instance_of_tested_class(layer_2)
      json_data = JSON.parse(presenter.to_json)

      json_data['id'].should == layer_2.id
      json_data['kind'].should == layer_2.kind
      json_data['order'].should == layer_2.order
      json_data['options'].should == layer_2.options
      json_data['infowindow'].should == layer_2.infowindow
      json_data['tooltip'].should == layer_2.tooltip

      presenter_options =  {
          viewer_user: @user_2,
          user: @user_1
        }

      #no changes to layer_2
      presenter = instance_of_tested_class(layer_2, presenter_options)
      json_data = JSON.parse(presenter.to_json)
      # to_json shouldn't change table_name even if viewer/user sent at presenter options
      json_data['options'].should == layer_2.options
    end

    it 'Tests to_poro()' do
      table_name = 'test_table'

      layer_2 = Layer.create(
        kind: 'carto',
        order: 13,
        options: {
          'fake' => 'value',
          'table_name' => table_name
        },
        infowindow: { 'fake2' => 'val2' },
        tooltip: { 'fake3' => 'val3' }
      )
      layer_2 = instance_of_tested_model(layer_2)

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
        }
      }
      expected_options = expected_poro.delete('options')

      poro = instance_of_tested_class(layer_2).to_poro
      poro_options = poro.delete('options')

      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)

      # Now add presenter options to change table_name (new way)
      expected_options['table_name'] = "#{@user_1.database_schema}.#{table_name}"

      presenter_options = {
        viewer_user: @user_2,
        # New presenter way of sending a viewer that's different from the owner
        user: @user_1
      }

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      poro_options = poro.delete('options')

      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)

      # old way

      # change state always with old model to be sure
      layer_2 = ::Layer.where(id: layer_2.id).first
      layer_2.options = {
        'fake' => 'value',
        'table_name' => table_name,
        # Old presenter way of sending a viewer
        'user_name' => @user_1.username
      }
      layer_2.save
      layer_2 = instance_of_tested_model(layer_2)

      expected_poro = {
        'id' => layer_2.id,
        'kind' => 'carto',
        'order' => 13,
        'options' => {
          'fake' => 'value',
          'table_name' => "#{@user_1.username}.#{table_name}",
          'user_name' => @user_1.username
        },
        'infowindow' => {
          'fake2' => 'val2'
        },
        'tooltip' => {
          'fake3' => 'val3'
        }
      }

      presenter_options = {
        viewer_user: @user_2
      }

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      # Already changed to fully qualified expected table name, so no need to do it again
      poro_options = poro.delete('options')
      expected_options = expected_poro.delete('options')
      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)

      # Finally, don't change if already has a fully qualified table_name

      layer_2 = ::Layer.where(id: layer_2.id).first
      layer_2.options = {
        'fake' => 'value',
        'table_name' => "fake.#{table_name}",
        # Old presenter way of sending a viewer
        'user_name' => @user_1.username
      }
      layer_2.save
      layer_2 = instance_of_tested_model(layer_2)

      expected_options['table_name'] = "fake.#{table_name}"

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      poro_options = poro.delete('options')
      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)
    end

    it 'Tests to_poro() with uuid table name' do
      table_name = '000cd294-b124-4f82-b569-0f7fe41d2db8'

      layer_2 = Layer.create(
        kind: 'carto',
        order: 13,
        options: {
          'fake' => 'value',
          'table_name' => table_name
        },
        infowindow: { 'fake2' => 'val2' },
        tooltip: { 'fake3' => 'val3' }
      )
      layer_2 = instance_of_tested_model(layer_2)

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
        }
      }
      expected_options = expected_poro.delete('options')

      poro = instance_of_tested_class(layer_2).to_poro
      poro_options = poro.delete('options')

      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)

      # Now add presenter options to change table_name (new way)
      expected_options['table_name'] = "#{@user_1.database_schema}.\"#{table_name}\""

      presenter_options = {
        viewer_user: @user_2,
        # New presenter way of sending a viewer that's different from the owner
        user: @user_1
      }

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      poro_options = poro.delete('options')

      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)

      # old way

      # change state always with old model to be sure
      layer_2 = ::Layer.where(id: layer_2.id).first
      layer_2.options = {
        'fake' => 'value',
        'table_name' => table_name,
        # Old presenter way of sending a viewer
        'user_name' => @user_1.username
      }
      layer_2.save
      layer_2 = instance_of_tested_model(layer_2)

      expected_poro = {
        'id' => layer_2.id,
        'kind' => 'carto',
        'order' => 13,
        'options' => {
          'fake' => 'value',
          'table_name' => "#{@user_1.username}.\"#{table_name}\"",
          'user_name' => @user_1.username
        },
        'infowindow' => {
          'fake2' => 'val2'
        },
        'tooltip' => {
          'fake3' => 'val3'
        }
      }

      presenter_options = {
        viewer_user: @user_2
      }

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      # Already changed to fully qualified expected table name, so no need to do it again
      poro_options = poro.delete('options')
      expected_options = expected_poro.delete('options')
      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)

      # Finally, don't change if already has a fully qualified table_name

      layer_2 = ::Layer.where(id: layer_2.id).first
      layer_2.options = {
        'fake' => 'value',
        'table_name' => "fake.\"#{table_name}\"",
        # Old presenter way of sending a viewer
        'user_name' => @user_1.username
      }
      layer_2.save
      layer_2 = instance_of_tested_model(layer_2)

      expected_options['table_name'] = "fake.\"#{table_name}\""

      poro = instance_of_tested_class(layer_2, presenter_options).to_poro
      poro_options = poro.delete('options')
      expect(poro).to include(expected_poro)
      expect(poro_options).to include(expected_options)
    end

    it 'Tests to_vizjson_v1()' do
      layer_parent = Layer.create({
          kind: 'tiled'
        })
      layer_parent = instance_of_tested_model(layer_parent)

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
          tooltip: { 'fake3' => 'val3' }
        })
      layer = instance_of_tested_model(layer)

      expected_vizjson = {
        id: layer.id,
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

      presenter_options =  { }

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
      maps_api_template = "http://{user}.localhost.lan:8181"
      sql_api_template = "http://{user}.localhost.lan:8080"

      # Modules do not use '.any_instance' for stubbing
      ApplicationHelper.stubs(:maps_api_template).returns(maps_api_template)
      ApplicationHelper.stubs(:sql_api_template).returns(sql_api_template)


      stat_tag = '00000000-0000-0000-0000-000000000000'

      layer_parent = Layer.create({
          kind: 'tiled'
        })
      layer_parent = instance_of_tested_model(layer_parent)

      # Base, which should be a poro but with symbols

      vizjson = instance_of_tested_class(layer_parent).to_vizjson_v2
      vizjson[:id].should == layer_parent.id
      vizjson[:kind].should == nil
      vizjson[:type].should == layer_parent.kind

      presenter_options =  {
        visualization_id: stat_tag
      }


      # torque layer with very basic options
      layer = Layer.create({
          kind: 'torque',
          options: {
              'table_name' => 'my_test_table',
            },
        })
      layer = instance_of_tested_model(layer)

      expected_vizjson = {
        id: layer.id,
        type: layer.kind,
        order: layer.order,
        legend: nil,
        options: {
            stat_tag: stat_tag,
            maps_api_template: maps_api_template,
            sql_api_template: sql_api_template,
            tiler_protocol: nil,
            tiler_domain: nil,
            tiler_port: nil,
            sql_api_protocol: nil,
            sql_api_domain: nil,
            sql_api_endpoint: nil,
            sql_api_port: nil,
            layer_name: layer.options['table_name'],
            'table_name' => layer.options['table_name'],
            'query' => "select * from #{layer.options['table_name']}"
          }
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # torque layer, different viewer
      layer = Layer.create({
          kind: 'torque',
          options: {
            'table_name' => 'my_test_table',
            # This is only for compatibility with old LayerModule::Presenter, new one checkes in the presenter options
            'user_name' => @user_1.database_schema
            },
        })
      layer = instance_of_tested_model(layer)

      expected_vizjson[:id] = layer.id
      # No special quoting
      expected_vizjson[:options]['query'] = "select * from public.#{layer.options['table_name']}"
      expected_vizjson[:options]['user_name'] = @user_1.database_schema

      presenter_options =  {
          visualization_id: stat_tag,
          viewer_user: @user_2,
          # New presenter way of sending a viewer that's different from the owner
          user: @user_1
        }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # torque layer, different viewer, UUID table name
      layer = Layer.create(
        kind: 'torque',
        options: {
          'table_name' => '000cd294-b124-4f82-b569-0f7fe41d2db8',
          # This is only for compatibility with old LayerModule::Presenter, new one checkes in the presenter options
          'user_name' => @user_1.database_schema
        }
      )
      layer = instance_of_tested_model(layer)

      expected_vizjson[:id] = layer.id
      # No special quoting
      expected_vizjson[:options][:layer_name] = layer.options['table_name']
      expected_vizjson[:options]['table_name'] = layer.options['table_name']
      expected_vizjson[:options]['query'] = "select * from public.\"#{layer.options['table_name']}\""
      expected_vizjson[:options]['user_name'] = @user_1.database_schema

      presenter_options = {
        visualization_id: stat_tag,
        viewer_user: @user_2,
        # New presenter way of sending a viewer that's different from the owner
        user: @user_1
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # torque layer, custom query
      layer = Layer.create({
          kind: 'torque',
          options: {
            'query' => 'SELECT * FROM my_test_table LIMIT 5',
            'table_name' => 'my_test_table',
            },
        })
      layer = instance_of_tested_model(layer)

      presenter_options =  {
          visualization_id: stat_tag
        }

      expected_vizjson[:id] = layer.id
      expected_vizjson[:options][:layer_name] = layer.options['table_name']
      expected_vizjson[:options]['table_name'] = layer.options['table_name']
      expected_vizjson[:options]['query'] = layer.options['query']
      expected_vizjson[:options].delete('user_name')

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # torque layer, with wrapping
      layer = Layer.create({
          kind: 'torque',
          options: {
            'query' => 'SELECT * FROM my_test_table LIMIT 5',
            'table_name' => 'my_test_table',
            'query_wrapper' =>  "select * from (<%= sql %>)",
            # This options shouldn't appear as is not listed at presnter TORQUE_ATTRS
            'wadus' => 'whatever'
            }
        })
      layer = instance_of_tested_model(layer)

      presenter_options =  {
          visualization_id: stat_tag
        }

      expected_vizjson[:id] = layer.id
      expected_vizjson[:options]['query'] = "select * from (#{layer.options['query']})"

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson


      # CartoDB layer, minimal options
      layer = Layer.create({
          kind: 'carto',
          options: {
              'table_name' => 'my_test_table',
              'style_version' => '2.1.1',
              'interactivity' => 'something'
            },
        })
      layer = instance_of_tested_model(layer)

      presenter_options =  {
          visualization_id: stat_tag
        }

      expected_vizjson = {
        id: layer.id,
        type: 'CartoDB',
        order: layer.order,
        infowindow: nil,
        tooltip: nil,
        legend: nil,
        visible: nil,
        options: {
          sql: "select * from #{layer.options['table_name']}",
          layer_name: layer.options['table_name'],
          cartocss: @tested_class::EMPTY_CSS,
          cartocss_version: layer.options['style_version'],
          interactivity: layer.options['interactivity']
        }
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # CartoDB layer, non default fields filled. table_name UUID to check quoting
      layer = Layer.create(
        kind: 'carto',
        options: {
          'table_name' => '000cd294-b124-4f82-b569-0f7fe41d2db8',
          'style_version' => '2.1.1',
          'interactivity' => 'something',
          'tile_style' => '/* aaa */ #bbb{ marker-width: 12; } ',
          'legend' => {
            'type' => "custom",
            'show_title' => true,
            'title' => "xxx",
            'template' => "",
            'items' => [
              {
                'name' => "yyy",
                'visible' => true,
                'value' => "#ccc",
                'sync' => true
              }
            ]
          },
          'visible' => true,
          # Shouldn't appear
          'wadus' => 'whatever'
        },
        infowindow: {
          'fields' => nil,
          'template_name' => "infowindow_light",
          'template' => "<div></div>",
          'alternative_names' => {},
          'width' => 200,
          'maxHeight' => 100
        },
        tooltip: {
          'fields' => nil,
          'template_name' => "tooltip_light",
          'template' => "<div></div>",
          'alternative_names' => {},
          'maxHeight' => 180
        }
      )
      layer = instance_of_tested_model(layer)

      expected_vizjson = {
        id: layer.id,
        type: 'CartoDB',
        order: layer.order,
        infowindow: layer.infowindow,
        tooltip: layer.tooltip,
        legend: layer.legend,
        visible: true,
        options: {
          # yes... this ones come as symbols and not strings as the others (sigh)
          sql: "select * from \"#{layer.options['table_name']}\"",
          layer_name: layer.options['table_name'],
          cartocss: layer.options['tile_style'],
          cartocss_version: layer.options['style_version'],
          interactivity: layer.options['interactivity']
        }
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # CartoDB layer, non default fields filled
      layer = Layer.create({
          kind: 'carto',
          options: {
              'table_name' => 'my_test_table',
              'style_version' => '2.1.1',
              'interactivity' => 'something',
              'tile_style' => '/* aaa */ #bbb{ marker-width: 12; } ',
              'legend' => {
                  'type' => "custom",
                  'show_title' => true,
                  'title' => "xxx",
                  'template' => "",
                  'items' => [
                    {
                      'name' => "yyy",
                      'visible' => true,
                      'value' => "#ccc",
                      'sync' => true
                    }
                  ]
                },
              'visible' => true,
              # Shouldn't appear
              'wadus' => 'whatever'
            },
          infowindow: {
              'fields' => nil,
              'template_name' => "infowindow_light",
              'template' => "<div></div>",
              'alternative_names' => { },
              'width' => 200,
              'maxHeight' => 100
            },
          tooltip: {
              'fields' => nil,
              'template_name' => "tooltip_light",
              'template' => "<div></div>",
              'alternative_names' => { },
              'maxHeight' => 180
            }
        })
      layer = instance_of_tested_model(layer)

      expected_vizjson = {
        id: layer.id,
        type: 'CartoDB',
        order: layer.order,
        infowindow: layer.infowindow,
        tooltip: layer.tooltip,
        legend: layer.legend,
        visible: true,
        options: {
          # yes... this ones come as symbols and not strings as the others (sigh)
          sql: "select * from #{layer.options['table_name']}",
          layer_name: layer.options['table_name'],
          cartocss: layer.options['tile_style'],
          cartocss_version: layer.options['style_version'],
          interactivity: layer.options['interactivity']
        }
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      vizjson.should == expected_vizjson

      # CartoDB layer with `Full` options flag
      layer = Layer.create({
          kind: 'carto',
          options: {
              'table_name' => 'my_test_table',
              'interactivity' => 'something',
              'wadus' => 'whatever'
            }
        })
      layer = instance_of_tested_model(layer)

      presenter_options =  {
          visualization_id: stat_tag,
          full: true
        }

      expected_vizjson = {
        id: layer.id,
        type: 'CartoDB',
        order: layer.order,
        infowindow: nil,
        tooltip: nil,
        legend: nil,
        visible: nil,
        options: {
            'table_name' => layer.options['table_name'],
            'interactivity' => layer.options['interactivity'],
            'wadus' => 'whatever'
          }
      }

      vizjson = instance_of_tested_class(layer, presenter_options).to_vizjson_v2
      puts vizjson.inspect
      vizjson.should == expected_vizjson
    end

  end
end
