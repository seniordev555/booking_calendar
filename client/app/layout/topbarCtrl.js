(function() {
    'use strict';
    angular.module('newApp').controller('topbarCtrl', topbarCtrl);
    
    topbarCtrl.$inject = ['currentUser', '$scope', '$http', '$state', '$rootScope'];
    function topbarCtrl(currentUser, $scope, $http, $state, $rootScope) {
        $scope.isLoggedIn = currentUser.isSet();
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
    }
})();