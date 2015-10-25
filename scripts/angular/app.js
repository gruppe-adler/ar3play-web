angular.module('ar3playApp', [
  'ngRoute',
  'ar3playControllers',
])
.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/missions/:missionId', {
      templateUrl: '/templates/mission.html',
      controller: 'MissionController',
    })
    .when('/missions', {
      templateUrl: '/templates/missions.html',
      controller: 'MissionsController',
    })
    .when('/settings', {
      templateUrl: '/templates/settings.html',
      controller: 'SettingsController',
    })
    .otherwise({
      redirectTo: '/missions'
    });
})
