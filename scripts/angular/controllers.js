angular.module('ar3playControllers', ['ngRoute', 'ar3playServices'])
.controller('MissionsController', function($scope, $routeParams, Missions) {
  $scope.missions = Missions.query();
})
.controller('MissionController', function($scope, $routeParams, Mission, Settings) {
  $scope.mission = Mission.get({missionId: $routeParams.missionId}, function () {
    $scope.mission.time = $scope.mission.starttime;
    map.init($scope.mission.worldname.toLowerCase());
    Settings.showNames() ? map.showMarkers() : map.hideMarkers();
    map.setIsMarkersAnimated(Settings.animateMarkers());
    runner.setMission($scope.mission);
  });

  var resetSpeed = function () {
    $scope.play_speed = 1.0;
    $scope.play_multiplicator = 1.0;
    runner.setSpeed(1.0);
  };
  resetSpeed();

  $scope.restartRunner = function () {
    resetSpeed();
    runner.restart();
  };

  $scope.sliderChanged = function () {
    var multiplicator = Math.min(100, Math.pow($scope.play_speed, 1.5));
    runner.setSpeed(multiplicator);
    $scope.play_multiplicator = multiplicator.toFixed(1);
  };

  runner.onTimechange(function (time) {
    $scope.$apply(function () {
      $scope.mission.time = time;
    });
  });

  $scope.$on('$locationChangeStart', function( event ) {
    runner.setMission(null);
  });
})
.controller('SettingsController', function($scope, $routeParams, Settings) {
  $scope.settings = {};
  $scope.settings.animate_markers = Settings.animateMarkers();
  $scope.settings.api_url = Settings.apiUrl();
  $scope.settings.api_urls = Object.keys(dataSources).map(function (idx) {
    return {
      name: idx,
      value: dataSources[idx],
    };
  });
  $scope.settings.date_format = Settings.dateFormat();
  $scope.settings.show_names = Settings.showNames();

  $scope.save = function () {
    Settings.setAnimateMarkers($scope.settings.animate_markers);
    Settings.setApiUrl($scope.settings.api_url);
    Settings.setDateFormat($scope.settings.date_format);
    Settings.setShowNames($scope.settings.show_names);
  };
})
