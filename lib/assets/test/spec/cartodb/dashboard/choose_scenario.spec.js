
// describe("choose-scenario", function() {
//   var scenario
//     , user
//     , tables;

//   beforeEach(function() {
//     tables = new cdb.admin.Tables();
//     user = new cdb.admin.User({ id : "1" });

//     // Choose sceneario
//     scenario = new cdb.admin.dashboard.Scenario({
//       model: user
//     });
//   });

//   it("should review if the scenario is correct checking the created tables of the user", function() {
//     spyOn(scenario.model, 'fetch');
//     user.fetch();
//     expect(scenario.model.fetch).toHaveBeenCalled();
//   });
// });