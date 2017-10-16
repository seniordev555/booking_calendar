'use strict';

angular.module('newApp')
  .controller('adminSettingsController', ['$scope', 'currentUser', '$http', 'Flash', '$rootScope', 'LaddaLoadingService',
  function($scope, currentUser, $http, Flash, $rootScope, LaddaLoadingService) {
    $scope.isLoading = false;
    $scope.settings = {};

    $scope.$on('booking.admin_settings_modal_opened', function(angularEvent, angularEventParams) {
      $scope.settings = angular.copy($rootScope.adminSettings);
      if(!$scope.settings) {
        $scope.isLoading = true;
        $http.get(TXP.serverUrl + 'settings').then(function(response) {
          if(response.data && response.data.data) {
            $scope.settings = response.data.data;
          }
          $scope.isLoading = false;
        });
      }
    });

    $scope.saveSettings = function() {
      var loading = LaddaLoadingService.startLoadingButton(".save-admin-settings");
      $scope.isLoading = true;
      $http.put(TXP.serverUrl + 'settings', $scope.settings).then(function(response) {
        if(response.data && response.data.data) {
          $scope.settings = response.data.data;
          $rootScope.adminSettings = angular.copy($scope.settings);
          Flash.create('success', 'Admin Settings Saved Successfully.', 3000, { }, true);
        } else {
          Flash.create('danger', 'There is something wrong in the server.', 3000, { }, true);
        }
        $scope.isLoading = false;
        LaddaLoadingService.stopLoadingButton(loading);
      }, function(error) {
        Flash.create('danger', 'There is something wrong in the server.', 3000, { }, true);
        $scope.isLoading = false;
        LaddaLoadingService.stopLoadingButton(loading);
      });
    };

    $scope.removeMicrophone = function ($index) {
      $scope.settings.microphones.splice($index, 1);
    }

    $scope.addMicrophone = function () {
      $scope.settings.microphones.push('');
    }
}]);
