var dataUrl = '';

angular.module('ar3playServices', ['ngResource'])
.factory('Missions', function($resource, Settings) {
  return $resource(Settings.apiUrl() + '/missions');
})
.factory('Mission', function($resource, Settings) {
  return $resource(Settings.apiUrl() + '/mission/:missionId', {missionId: '@id'});
})
.factory('Settings', function($resource) {
  return {
    animateMarkers: function () {
      return JSON.parse(localStorage.getItem('animate-markers') || 'false');
    },
    setAnimateMarkers: function (value) {
      localStorage.setItem('animate-markers', value ? 'true' : 'false');
    },
    apiUrl: function () {
      if (!window.dataSources) {
          alert('missing config.js with dataSources definition!');
      }

      dataUrl = localStorage.getItem('api-url') || _.map(dataSources)[0] || 'http://' + (document.location.host || 'localhost') + ':12302';
      return dataUrl;
    },
    setApiUrl: function (value) {
      localStorage.setItem('api-url', value);
    },
    dateFormat: function () {
      return localStorage.getItem('date-format') || 'iso8601';
    },
    setDateFormat: function (value) {
      localStorage.setItem('date-format', value);
    },
    showNames: function () {
      return JSON.parse(localStorage.getItem('show-names') || 'false');
    },
    setShowNames: function (value) {
      localStorage.setItem('show-names', value ? 'true' : 'false');
    },
  };
})
