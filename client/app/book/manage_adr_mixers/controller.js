'use strict';

angular.module('newApp')
  .controller('manageAdrMixersController', ['$scope', 'currentUser', '$http', 'timeUtil', 'calendarUtil', '$compile', '$rootScope', 'LaddaLoadingService',
  function($scope, currentUser, $http, timeUtil, calendarUtil, $compile, $rootScope, LaddaLoadingService) {
    $scope.users = [];
    $scope.pagination = { pages: 1, page: 1, limit: 5, total: 0, q: '', isAdrMixer: false, role: '' };
    $scope.isLoading = false;

    $scope.$on('booking.adr_mixers_modal_opened', function(angularEvent, angularEventParams) {
      var query_string = 'q=' + $scope.pagination.q;
      query_string += '&page=1';
      query_string += '&limit' + $scope.pagination.limit;
      query_string += '&role=' + $scope.pagination.role;
      query_string += '&is_adr_mixer=' + $scope.pagination.isAdrMixer;
      $scope.getUsers(query_string);
    });

    $scope.pageChanged = function() {
      var query_string = 'q=' + $scope.pagination.q;
      query_string += '&page=' + $scope.pagination.page;
      query_string += '&limit' + $scope.pagination.limit;
      query_string += '&role=' + $scope.pagination.role;
      query_string += '&is_adr_mixer=' + $scope.pagination.isAdrMixer;
      $scope.getUsers(query_string);
    };

    $scope.submitForm = function() {
      var query_string = 'q=' + $scope.pagination.q;
      query_string += '&page=1';
      query_string += '&limit' + $scope.pagination.limit;
      query_string += '&role=' + $scope.pagination.role;
      query_string += '&is_adr_mixer=' + $scope.pagination.isAdrMixer;
      $scope.getUsers(query_string);
    };

    $scope.getUsers = function(query_string) {
      $scope.isLoading = true;
      $http.get(TXP.serverUrl + 'users?' + query_string).then(function (successResponse) {
        if (successResponse.data && successResponse.data.data) {
          var data = successResponse.data.data;
          $scope.users = data.docs;
          $scope.pagination.page = data.page;
          $scope.pagination.limit = data.limit;
          $scope.pagination.total = data.total;
          $scope.pagination.pages = data.pages;
        }
        $scope.isLoading = false;
      });
    };

    $scope.updateUser = function(ind) {
      var user = $scope.users[ind];
      var user_params = { isAdrMixer: user.isAdrMixer };
      $scope.isLoading = true;
      $http.put(TXP.serverUrl + 'users/' + user._id, user_params).then(function (successResponse) {
        $scope.isLoading = false;
      });
    };

}]);
