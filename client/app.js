'use strict';

/**
 * @ngdoc overview
 * @name newappApp
 * @description
 * # newappApp
 *
 * Main module of the application.
 */
angular.module('newApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ui.router',
    'permission',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'oc.lazyLoad',
    'ngFlash',
    'xeditable'
]);


// Route State Load Spinner(used on page or content load)
angular.module('newApp').directive('ngSpinnerLoader', ['$rootScope',
    function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                // by defult hide the spinner bar
                element.addClass('hide'); // hide spinner bar by default
                // display the spinner bar whenever the route changes(the content part started loading)
                $rootScope.$on('$routeChangeStart', function() {
                    element.removeClass('hide'); // show spinner bar
                });
                // hide the spinner bar on rounte change success(after the content loaded)
                $rootScope.$on('$routeChangeSuccess', function() {
                    setTimeout(function(){
                        element.addClass('hide'); // hide spinner bar
                    },500);
                    $("html, body").animate({
                        scrollTop: 0
                    }, 500);
                });
            }
        };
    }
])

angular.module("newApp").run(['$rootScope', '$state', '$stateParams', 'currentUser', '$http', 'editableOptions', 'editableThemes',
    function ($rootScope, $state, $stateParams, currentUser, $http, editableOptions, editableThemes) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.serverUrl = TXP.serverUrl;
        $rootScope.adminSettings = {};
        editableOptions.theme = 'bs3';
        editableThemes.bs3.inputClass = 'input-sm';
        editableThemes.bs3.buttonsClass = 'btn-sm';

        $http.get(TXP.serverUrl + 'settings').then(function(response) {
            if(response.data && response.data.data) {
                $rootScope.adminSettings = response.data.data || {};
            }
        });
    }
]);
