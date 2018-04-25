# encoding: utf-8

require 'factories/carto_visualizations'
require 'spec_helper_min'

module Carto
  module Tracking
    module Events
      describe 'Events' do
        include Carto::Factories::Visualizations

        before(:all) do
          @user = FactoryGirl.create(:carto_user, private_maps_enabled: true)
          @intruder = FactoryGirl.create(:carto_user)
          @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
          @visualization.privacy = 'private'
          @visualization.save!
          @visualization.reload
        end

        after(:all) do
          destroy_full_visualization(@map, @table, @table_visualization, @visualization)
          @user.destroy
          @intruder.destroy
        end

        def days_with_decimals(time_object)
          time_object.to_f / 60 / 60 / 24
        end

        def check_hash_has_keys(hash, keys)
          keys.each do |key|
            puts "checking #{key} is not nil"
            hash[key].should_not be_nil
          end
        end

        describe ExportedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have read access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:is_accesible_by_user?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properties' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_user_id,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CreatedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        origin: 'import')
            end

            it 'requires a origin' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import',
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import',
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import',
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     origin: 'import',
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     origin: 'import',
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_user_id,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      origin: 'bananas')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe AppliedSql do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError) if @event
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        sql: 'bla')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        sql: 'bla')
            end

            it 'requires a sql' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end

            it 'can have a node_id' do
              event = @event_class.new(@user.id,
                                       user_id: @user.id,
                                       visualization_id: @visualization.id,
                                       sql: 'bla',
                                       node_id: '1')

              expect { event.report! }.to_not raise_error
            end

            it 'can have a dataset_id' do
              event = @event_class.new(@user.id,
                                       user_id: @user.id,
                                       visualization_id: @visualization.id,
                                       sql: 'bla',
                                       dataset_id: '1')

              expect { event.report! }.to_not raise_error
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        sql: 'bla',
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        sql: 'import',
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        sql: 'import',
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     sql: 'import',
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     sql: 'import',
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end
        end

        describe AppliedCartocss do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla')
            end

            it 'requires a layer_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        cartocss: 'bla')
            end

            it 'requires a cartocss' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla',
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla')

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla')

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     user_id: @user.id,
                                     visualization_id: @visualization.id,
                                     layer_id: @visualization.data_layers.first.id,
                                     cartocss: 'bla')

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     user_id: @intruder.id,
                                     visualization_id: @visualization.id,
                                     layer_id: @visualization.data_layers.first.id,
                                     cartocss: 'bla')

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end
        end

        describe ModifiedStyleForm do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla',
                                        style_properties: 'bla')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla',
                                        style_properties: 'bla')
            end

            it 'requires a layer_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        cartocss: 'bla',
                                        style_properties: 'bla')
            end

            it 'requires a cartocss' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        style_properties: 'bla')
            end

            it 'requires a style_properties' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla')
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla',
                                        style_properties: 'bla',
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla',
                                        style_properties: 'bla')

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        cartocss: 'bla',
                                        style_properties: 'bla')

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     user_id: @user.id,
                                     visualization_id: @visualization.id,
                                     layer_id: @visualization.data_layers.first.id,
                                     cartocss: 'bla',
                                     style_properties: 'bla')

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     user_id: @intruder.id,
                                     visualization_id: @visualization.id,
                                     layer_id: @visualization.data_layers.first.id,
                                     cartocss: 'bla',
                                     style_properties: 'bla')

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end
        end

        describe DeletedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe PublishedMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:creation_time,
                                       :event_origin,
                                       :lifetime,
                                       :object_created_at,
                                       :plan,
                                       :privacy,
                                       :type,
                                       :user_active_for,
                                       :user_created_at,
                                       :vis_id]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      origin: 'bananas')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CompletedConnection do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:connection) do
            {
              data_from: 'Manolo',
              imported_from: 'Escobar',
              sync: true,
              file_type: '.manolo'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        connection: connection)
            end

            it 'requires a connection' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        connection: connection,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        connection: connection)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     user_id: @user.id,
                                     connection: connection)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:data_from,
                                       :imported_from,
                                       :sync,
                                       :file_type,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      user_id: @user.id,
                                      connection: connection)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe FailedConnection do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:connection) do
            {
              data_from: 'Manolo',
              imported_from: 'Escobar',
              sync: true,
              file_type: '.manolo'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, connection: connection)
            end

            it 'requires a connection' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        connection: connection,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        user_id: @user.id,
                                        connection: connection)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     user_id: @user.id,
                                     connection: connection)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:data_from,
                                       :imported_from,
                                       :sync,
                                       :file_type,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      user_id: @user.id,
                                      connection: connection)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ExceededQuota do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, {})
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id, user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id, user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports with optional quota_overage' do
            event = @event_class.new(@user.id, user_id: @user.id, quota_overage: 123)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:creation_time,
                                       :event_origin,
                                       :plan,
                                       :quota_overage,
                                       :user_active_for,
                                       :user_created_at]

            format = @event_class.new(@user.id, user_id: @user.id, quota_overage: 123)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ScoredTrendingMap do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        mapviews: 123)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        mapviews: 123)
            end

            it 'requires mapviews' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        mapviews: 123,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        mapviews: 123)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        mapviews: 123)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     mapviews: 123)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     mapviews: 123)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:creation_time,
                                       :event_origin,
                                       :map_id,
                                       :map_name,
                                       :mapviews,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      mapviews: 123)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe VisitedPrivatePage do

        end

        describe CreatedDataset do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        origin: 'import')
            end

            it 'requires a origin' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import',
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import',
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        origin: 'import',
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     origin: 'import',
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     origin: 'import',
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      origin: 'bananas')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe DeletedDataset do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_origin,
                                       :creation_time]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CreatedAnalysis do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:analysis) do
            {
              id: 'xxx-xxx-xxx-xxx',
              natural_id: 'z3',
              type: 'georeference'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        analysis: analysis)
            end

            it 'requires an analysis' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        analysis: analysis)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        analysis: analysis)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     analysis: analysis)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     analysis: analysis)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_user_id,
                                       :event_origin,
                                       :creation_time,
                                       :analysis_id,
                                       :analysis_natural_id,
                                       :analysis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      analysis: analysis)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ModifiedAnalysis do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:analysis) do
            {
              id: 'xxx-xxx-xxx-xxx',
              natural_id: 'z3',
              type: 'georeference'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        analysis: analysis)
            end

            it 'requires an analysis' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        analysis: analysis)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        analysis: analysis)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     analysis: analysis)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     analysis: analysis)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_user_id,
                                       :event_origin,
                                       :creation_time,
                                       :analysis_id,
                                       :analysis_natural_id,
                                       :analysis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      analysis: analysis)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe CreatedWidget do
          before(:all) do
            @widget = FactoryGirl.create(:widget, layer: @visualization.data_layers.first)
          end

          after(:all) do
            @widget.destroy
          end

          it 'should validate the widget exists' do
            event = Carto::Tracking::Events::CreatedWidget.new(@user.id,
                                                               user_id: @user.id,
                                                               visualization_id: @visualization.id,
                                                               widget_id: random_uuid)

            expect { event.report! }.to raise_error(Carto::LoadError)
          end

          it 'should report when valid widget' do
            event = Carto::Tracking::Events::CreatedWidget.new(@user.id,
                                                               user_id: @user.id,
                                                               visualization_id: @visualization.id,
                                                               widget_id: @widget.id)

            expect { event.report! }.to_not raise_error
          end
        end

        describe DeletedAnalysis do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          let(:analysis) do
            {
              id: 'xxx-xxx-xxx-xxx',
              natural_id: 'z3',
              type: 'georeference'
            }
          end

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        analysis: analysis)
            end

            it 'requires an analysis' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        analysis: analysis,
                                        extra: 'extra')
            end
          end

          describe '#security validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            after(:all) do
              @event = nil
            end

            it 'must have write access to visualization' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @intruder.id,
                                        analysis: analysis)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end

            it 'must be reported by user' do
              @event = @event_class.new(@intruder.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        analysis: analysis)

              expect { @event.report! }.to raise_error(Carto::UnauthorizedError)
            end
          end

          it 'reports' do
            event = @event_class.new(@user.id,
                                     visualization_id: @visualization.id,
                                     user_id: @user.id,
                                     analysis: analysis)

            expect { event.report! }.to_not raise_error
          end

          it 'reports by user with access' do
            event = @event_class.new(@intruder.id,
                                     visualization_id: @visualization.id,
                                     user_id: @intruder.id,
                                     analysis: analysis)

            Carto::Visualization.any_instance.stubs(:writable_by?).with(@intruder).returns(true)

            expect { event.report! }.to_not raise_error
          end

          it 'matches current prod properites' do
            current_prod_properties = [:vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :event_user_id,
                                       :event_origin,
                                       :creation_time,
                                       :analysis_id,
                                       :analysis_natural_id,
                                       :analysis_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      analysis: analysis)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe DownloadedLayer do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        format: 'csv',
                                        source: 'd0',
                                        table_name: 'test',
                                        visible: true)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        format: 'csv',
                                        source: 'd0',
                                        table_name: 'test',
                                        visible: true)
            end

            it 'requires a layer_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        format: 'csv',
                                        source: 'd0',
                                        table_name: 'test',
                                        visible: true)
            end

            it 'requires a format' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        source: 'd0',
                                        table_name: 'test',
                                        visible: true)
            end

            it 'requires a source' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        format: 'csv',
                                        table_name: 'test',
                                        visible: true)
            end

            it 'requires a table_name' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        format: 'csv',
                                        source: 'd0',
                                        visible: true)
            end

            it 'requires a visible' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        format: 'csv',
                                        source: 'd0',
                                        table_name: 'test')
            end

            it 'does not allow adding any other additional property' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        user_id: @user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        format: 'csv',
                                        source: 'd0',
                                        table_name: 'test',
                                        visible: true,
                                        extra: 'extra')
            end
          end

          it 'matches current prod properties' do
            current_prod_properties = [:creation_time,
                                       :event_user_id,
                                       :event_origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :layer_id,
                                       :format,
                                       :source,
                                       :table_name,
                                       :visible]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      layer_id: @visualization.data_layers.first.id,
                                      format: 'csv',
                                      source: 'd0',
                                      table_name: 'test',
                                      visible: true)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe DraggedNode do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        extra: 'extra')
            end
          end
        end

        describe CreatedLayer do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        visualization_id: @visualization.id,
                                        empty: true)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        user_id: @user.id,
                                        empty: true)
            end

            it 'requires a layer_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        empty: true)
            end

            it 'requires a empty' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        layer_id: @visualization.data_layers.first.id,
                                        empty: true,
                                        extra: 'extra')
            end
          end

          it 'matches current prod properties' do
            current_prod_properties = [:creation_time,
                                       :event_user_id,
                                       :event_origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :layer_id,
                                       :empty]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      layer_id: @visualization.data_layers.first.id,
                                      empty: true)
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe StyledByValue do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        attribute: 'test',
                                        attribute_type: 'test')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        attribute: 'test',
                                        attribute_type: 'test',
                                        user_id: @user.id)
            end

            it 'requires an attribute' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        attribute_type: 'test')
            end

            it 'requires an attribute_type' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        attribute: 'test')
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        attribute: 'test',
                                        extra: 'extra')
            end
          end

          it 'matches current prod properties' do
            current_prod_properties = [:creation_time,
                                       :event_user_id,
                                       :event_origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :attribute,
                                       :attribute_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      attribute: 'test',
                                      attribute_type: 'test')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe ChangedDefaultGeometry do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id)
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        extra: 'extra')
            end
          end
        end

        describe AggregatedGeometries do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id,
                                        visualization_id: @visualization.id,
                                        agg_type: 'hexabins',
                                        previous_type: 'simple')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        agg_type: 'hexabins',
                                        previous_agg_type: 'simple')
            end

            it 'requires a agg_type' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        previous_agg_type: 'simple')
            end
            it 'requires a previous_agg_type' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        agg_type: 'hexabins')
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        agg_type: 'hexabins',
                                        previous_agg_type: 'simple',
                                        extra: 'extra')
            end
          end

          it 'matches current prod properties' do
            current_prod_properties = [:creation_time,
                                       :event_user_id,
                                       :event_origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :agg_type,
                                       :previous_agg_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      agg_type: 'test',
                                      previous_agg_type: 'test')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end

        describe UsedAdvancedMode do
          before (:all) { @event_class = self.class.description.constantize }
          after  (:all) { @event_class = nil }

          describe '#properties validation' do
            after(:each) do
              expect { @event.report! }.to raise_error(Carto::UnprocesableEntityError)
            end

            after(:all) do
              @event = nil
            end

            it 'requires a user_id' do
              @event = @event_class.new(@user.id, visualization_id: @visualization.id, mode_type: 'sql')
            end

            it 'requires a visualization_id' do
              @event = @event_class.new(@user.id, user_id: @user.id, mode_type: 'cartocss')
            end

            it 'requires a mode_type' do
              @event = @event_class.new(@user.id, user_id: @user.id, visualization_id: @visualization.id)
            end

            it 'does not allow adding any additional property' do
              @event = @event_class.new(@user.id,
                                        user_id: @user.id,
                                        visualization_id: @visualization.id,
                                        mode_type: 'cartocss',
                                        extra: 'extra')
            end
          end

          it 'matches current prod properties' do
            current_prod_properties = [:creation_time,
                                       :event_user_id,
                                       :event_origin,
                                       :plan,
                                       :user_active_for,
                                       :user_created_at,
                                       :vis_id,
                                       :privacy,
                                       :type,
                                       :object_created_at,
                                       :lifetime,
                                       :mode_type]

            format = @event_class.new(@user.id,
                                      visualization_id: @visualization.id,
                                      user_id: @user.id,
                                      mode_type: 'cartocss')
                                 .instance_eval { @format }

            check_hash_has_keys(format.to_segment, current_prod_properties)
          end
        end
      end
    end
  end
end
