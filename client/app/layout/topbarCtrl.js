(function() {
    'use strict';
    angular.module('newApp').controller('topbarCtrl', topbarCtrl);

    topbarCtrl.$inject = ['currentUser', '$scope', '$http', '$state', '$rootScope'];
    function topbarCtrl(currentUser, $scope, $http, $state, $rootScope) {
        $scope.isLoggedIn = currentUser.isSet();
        $scope.isAdmin = currentUser.hasRole('admin');
        $scope.logout = logout;
        $scope.profilePhoto = $rootScope.serverUrl + 'theme_components/assets/global/images/avatars/user.png';
        $scope.fullname = '';

        if ($scope.isLoggedIn) {
            var user = currentUser.get();
            $scope.fullname = user.fullname;
            if (user.profilePhoto) {
                $scope.profilePhoto = user.profilePhoto;
            }
        }

        function logout() {
            $http.get($rootScope.serverUrl + 'logout').then(function(){
                $state.go('bookingOnCalendar', {b_id: ""}, {reload: true});
            });
        }

        $scope.manageAdrMixers = function() {
            $('#manage_adr_mixers_modal').modal({ backdrop: 'static' });
            $rootScope.$broadcast('booking.adr_mixers_modal_opened');
        };

        $scope.manageAdminSettings = function() {
            $('#admin_settings').modal({ backdrop: 'static' });
            $rootScope.$broadcast('booking.admin_settings_modal_opened');
        }
    }
})();
