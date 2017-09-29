(function() {
    'use strict';
    angular.module('newApp').controller('loginCtrl', loginCtrl);
    
    loginCtrl.$inject = ['currentUser', '$scope'];
    function loginCtrl(currentUser, $scope) {
        $scope.isLoggedIn = currentUser.isSet();
        $scope.loginFacebook = loginFacebook;
        
        //from MAKE theme make-theme\admin\assets\global\js\pages\login-v1.js
        function copyrightPos() {
            var windowHeight = $(window).height();
            if (windowHeight < 700) {
                $('.account-copyright').css('position', 'relative').css('margin-top', 40);
            } else {
                $('.account-copyright').css('position', '').css('margin-top', '');
            }
        }
        $(window).resize(function() {
            copyrightPos();
        });
        copyrightPos();
        
        $.backstretch([
            "../../theme_components/assets/global/images/gallery/login.jpg",
            "../../theme_components/assets/global/images/gallery/login2.jpg",
            "../../theme_components/assets/global/images/gallery/login3.jpg",
            "../../theme_components/assets/global/images/gallery/login4.jpg",
            "../../theme_components/assets/global/images/gallery/login5.jpg"
        ], {
            fade: 600,
            duration: 4000
        });
        //end from MAKE theme
        
        
        function loginFacebook() {
            window.location = '/auth/facebook';
        }        
    }
})();