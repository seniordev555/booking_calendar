'use strict';

angular.module('newApp')
  .controller('adminSettingsController', ['$scope', 'currentUser', '$http', 'timeUtil', 'calendarUtil', '$compile', '$rootScope', 'LaddaLoadingService',
  function($scope, currentUser, $http, timeUtil, calendarUtil, $compile, $rootScope, LaddaLoadingService) {
    $scope.isLoading = false;

    $scope.saveSettings = function() {
      var loading = LaddaLoadingService.startLoadingButton(".save-admin-settings");
      $scope.isLoading = true;
      setTimeout(function() {
        $scope.isLoading = false;
        LaddaLoadingService.stopLoadingButton(loading);
      }, 3000);

    };
}]);
