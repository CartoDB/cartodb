/*


  describe('when analysis-definition-node is created', function () {
    beforeEach(function () {
      this.a0 = this.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });
    });

    it('should analyse node', function () {
      expect(this.analysis.analyse).toHaveBeenCalledWith({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foobar'
        }
      });
    });

    describe('when changed', function () {
      beforeEach(function () {
        this.analysis.analyse.calls.reset();
        this.a0.set('query', 'SELECT * FROM foobar LIMIT 10');
      });

      it('should analyse node again but with changed query', function () {
        expect(this.analysis.analyse).toHaveBeenCalled();
        expect(this.analysis.analyse).toHaveBeenCalledWith(
          jasmine.objectContaining({
            params: {
              query: 'SELECT * FROM foobar LIMIT 10'
            }
          })
        );
      });
    });

    describe('when changed only id', function () {
      beforeEach(function () {
        this.analysis.analyse.calls.reset();
        this.a0.set('id', 'b0');
      });

      it('should not analyse node', function () {
        expect(this.analysis.analyse).not.toHaveBeenCalled();
      });

      it('should change the node id in CARTO.js', function () {
        expect(this.analysis.findNodeById('b0')).toBeDefined();
        expect(this.analysis.findNodeById('a0')).not.toBeDefined();
      });
    });

    describe('when changed id and another thing', function () {
      beforeEach(function () {
        this.analysis.analyse.calls.reset();
        this.a0.set({
          id: 'b0',
          query: 'SELECT * FROM whatever'
        });
      });

      it('should analyse node', function () {
        expect(this.analysis.analyse).toHaveBeenCalled();
      });

      it('should change the node id in CARTO.js', function () {
        expect(this.analysis.findNodeById('b0')).toBeDefined();
        expect(this.analysis.findNodeById('a0')).toBeDefined();
      });
    });

    describe('when an analysis-definition is added for source node', function () {
      beforeEach(function () {
        spyOn(this.a0.querySchemaModel, 'set');
        this.analysisDefinitionsCollection.add({analysis_definition: this.a0.toJSON()});
      });

      it('should setup sub-models of node-definition', function () {
        expect(this.a0.querySchemaModel.get('query')).toEqual('SELECT * FROM foobar');
        expect(this.a0.queryGeometryModel.get('query')).toBe('SELECT * FROM foobar');
        expect(this.a0.queryGeometryModel.get('ready')).toBe(true);
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          this.analysis.findNodeById('a0').set('status', 'ready');
        });

        it('should not affect the query-schema-model if its a source', function () {
          expect(this.a0.querySchemaModel.set).not.toHaveBeenCalled();
        });
      });

      describe('when analysis-definition-node is removed', function () {
        beforeEach(function () {
          expect(this.analysis.findNodeById('a0')).toBeDefined();
          this.analysisDefinitionNodesCollection.remove(this.a0);
        });

        it('should remove node', function () {
          expect(this.analysis.findNodeById('a0')).toBeUndefined();
        });
      });
    });

    describe('when an analysis definition is added for non-source node', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.add({
          analysis_definition: {
            id: 'a1',
            type: 'buffer',
            params: {
              radius: 10,
              source: this.a0.toJSON()
            }
          }
        });
        this.a1 = this.analysisDefinitionNodesCollection.get('a1');
      });

      it('should setup sub-models of node-definition', function () {
        expect(this.a1.querySchemaModel.get('query')).toEqual(undefined);
        expect(this.a1.queryGeometryModel.get('query')).toEqual(undefined);
        expect(this.a1.queryGeometryModel.get('ready')).toBe(false);
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          this.node = this.analysisDefinitionNodesCollection.get('a1');
          spyOn(this.node.queryGeometryModel, 'fetch');
          spyOn(this.node.querySchemaModel, 'fetch');
          spyOn(this.node.queryRowsCollection, 'fetch');
          this.node.USER_SAVED = true;
          this.analysis.findNodeById('a1').set({
            query: 'SELECT buffer FROM tmp_result_table_123',
            status: 'ready'
          });
        });

        it('should launch the onboarding analysis if the user saved the node', function () {
          expect(AnalysisOnboardingLauncher.launch).toHaveBeenCalled();
          expect(this.node.USER_SAVED).toBeFalsy();
        });
      });

      describe('when analysis node has finished executing', function () {
        beforeEach(function () {
          spyOn(this.a1.queryGeometryModel, 'fetch');
          spyOn(this.a1.querySchemaModel, 'fetch');
          spyOn(this.a1.queryRowsCollection, 'fetch');
          this.analysis.findNodeById('a1').set({
            query: 'SELECT buffer FROM tmp_result_table_123',
            status: 'ready'
          });
        });

        it('should update the sub-models', function () {
          expect(this.a1.querySchemaModel.get('query')).toEqual('SELECT buffer FROM tmp_result_table_123');
          expect(this.a1.queryGeometryModel.get('query')).toEqual('SELECT buffer FROM tmp_result_table_123');
          expect(this.a1.queryGeometryModel.get('ready')).toBe(true);
        });
      });
    });

    describe('queryRowsCollection', function () {
      beforeEach(function () {
        this.a0.queryRowsCollection.reset([{
          c0: 'wadus'
        }, {
          c0: 'foo'
        }], {silent: true});
      });

      it('should reload map when removing a row', function () {
        var row = this.a0.queryRowsCollection.at(0);
        this.a0.queryRowsCollection.remove(row);
        expect(this.integrations._diDashboard._dashboard.vis.reload).toHaveBeenCalled();
      });
    });
  });


*/
