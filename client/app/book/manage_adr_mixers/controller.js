'use strict';

angular.module('newApp')
  .controller('manageAdrMixersController', ['$scope', 'currentUser', '$http', 'timeUtil', 'calendarUtil', '$compile', '$rootScope',
  function($scope, currentUser, $http, timeUtil, calendarUtil, $compile, $rootScope) {
    $scope.users = [];
    $scope.pagination = { pages: 1, page: 1, limit: 5, total: 0, q: '', isAdrMixer: false, role: '', sort_field: 'fullname', sort_order: -1 };
    $scope.isLoading = false;

    $scope.$on('booking.adr_mixers_modal_opened', function(angularEvent, angularEventParams) {
      $scope.pagination.page = 1;
      $scope.getUsers($scope.buildQuery());
    });

    $scope.pageChanged = function() {
      $scope.getUsers($scope.buildQuery());
    };

    $scope.submitForm = function() {
      $scope.pagination.page = 1;
      $scope.getUsers($scope.buildQuery());
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

    $scope.updateUser = function(user, user_params) {
      $scope.isLoading = true;
      $http.put(TXP.serverUrl + 'users/' + user._id, user_params).then(function (successResponse) {
        $scope.isLoading = false;
      });
    };

    $scope.deleteUser = function(ind) {
      var user = $scope.users[ind];
      swal({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this user!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        $scope.isLoading = true;
        if (willDelete) {
          $http.delete(TXP.serverUrl + 'users/' + user._id).then(function (successResponse) {
            if (successResponse.status == 204) {
              $scope.pagination.page = 1;
              $scope.getUsers($scope.buildQuery());
            } else {
              $scope.isLoading = false;
              swal("Error!", "You can't delete this user because of server error.", "error");
            }
          });
        }
      });
    };

    $scope.sortClass = function(field) {
      return field != $scope.pagination.sort_field ? 'fa-sort' : (
        $scope.pagination.sort_order == 1 ? 'fa-sort-asc' : 'fa-sort-desc'
        );
    };

    $scope.sortTable = function(field) {
      if(field == $scope.pagination.sort_field) {
        $scope.pagination.sort_order = $scope.pagination.sort_order * (-1);
      } else {
        $scope.pagination.sort_field = field;
        $scope.pagination.sort_order = -1;
      }
      $scope.getUsers($scope.buildQuery());
    };

    $scope.buildQuery = function() {
      var query_string = 'q=' + $scope.pagination.q;
      query_string += '&page=' + $scope.pagination.page;
      query_string += '&limit' + $scope.pagination.limit;
      query_string += '&role=' + $scope.pagination.role;
      query_string += '&is_adr_mixer=' + $scope.pagination.isAdrMixer;
      query_string += '&sort=' + $scope.pagination.sort_field;
      query_string += '&order=' + ($scope.pagination.sort_order == 1 ? 'asc' : 'desc');
      return query_string;
    };

    $scope.userLastSignInAt = function(date) {
      return !!date ? timeUtil.formatDateClient(date) : '';
    };

    $scope.updateAdrMixer = function(ind) {
      var user = $scope.users[ind];
      var user_params = { isAdrMixer: user.isAdrMixer };
      $scope.updateUser(user, user_params)
    };

    $scope.updateRole = function(ind, role) {
      var user = $scope.users[ind];
      console.log(role, user.role);
      var user_params = { role: role };
      $scope.updateUser(user, user_params);
    };

}]);
