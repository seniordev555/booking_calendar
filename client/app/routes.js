/*
 * All app routes here
 */
angular.module('newApp').config(function($stateProvider, $urlRouterProvider) {
    // @link: caveats section https://www.npmjs.com/package/angular-permission
    $urlRouterProvider.otherwise( function($injector) {
        var $state = $injector.get("$state");
        $state.go('bookingOnCalendar');
    });

    $stateProvider.state('admin', {
        abstract: true,
        //we don't need url
        templateUrl: "./app/layout/admin.html",
        data: { pageTitle: 'Admin', bodyClass: 'sidebar-top  theme-sdtl bg-light-dark color-primary' },
        controller: 'mainCtrl',
        resolve: {
            loadPlugin: function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                ]);
            },
            currentUser2: ['$http', 'currentUser','$q', '$rootScope', function ($http, currentUser, $q, $rootScope) {
                var deferred = $q.defer();
                //fetch user info
                var req = $http({'method': 'GET', 'url': $rootScope.serverUrl + 'me'});
                req.then(function (response) {
                    if (response && angular.isObject(response.data)) {
                        currentUser.save(response.data);
                        deferred.resolve(response.data);
                    } else {
                        currentUser.clear();
                        deferred.resolve();
                    }
                }, function(){
                    currentUser.clear();
                    deferred.resolve();
                });

                return deferred.promise;
            }]
        }
    })
    .state('bookingOnCalendar', {
        parent: 'admin',
        url: "/booking/:b_id",
        templateUrl: "./app/book/calendar.html",
        controller: "calendarCtrl",
        data: {
            pageTitle: 'Booking', bodyClass: 'sidebar-top  theme-sdtl bg-light-dark color-primary'
//            permissions: {
//                except: ['anonymous'], redirectTo: 'login'
//            }
        },
        resolve: {
            loadPlugin: function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                    {
                        name: 'bookingOnCalendar',
                        files: [
                            './app/book/calendarCtrl.js',
                            './app/book/event-logs/eventLogsCtrl.js',
                            './app/book/personnel/personnelCtrl.js',
                            './app/book/manage-booking/manageBookingCtrl.js',
                            './app/book/billing/billingCtrl.js',
                            './app/book/technical-specifications/technicalSpecificationsCtrl.js',
                            './app/book/manage_adr_mixers/controller.js'
                        ]
                    }
                ]);
            },
            // currentUser2 is resolved from the parent route
            settings: ['UserSettings', '$q', 'currentUser2', function (UserSettings, $q, currentUser2) {
                var deferred = $q.defer();
                if (!currentUser2) {
                    // not logged in
                    deferred.resolve({
                        calendar_mode: null,
                        dont_show_tour: true
                    });
                    return deferred.promise;
                }
                $q.all([UserSettings.get('calendar_mode'), UserSettings.get('dont_show_tour')]).then(function (data) {
                    deferred.resolve({
                        calendar_mode: data[0],
                        dont_show_tour: data[1]
                    });
                });
                return deferred.promise;
            }],
            // if not visit a direct booking link --> resolve null
            // if visit a direct booking link but not logged in--> resolve false
            // otherwise, resolve booking object
            visitingBooking: ['$http', '$q', '$stateParams', '$rootScope', 'currentUser2', function ($http, $q, $stateParams, $rootScope, currentUser2) {
                var deferred = $q.defer();
                if (!$stateParams.b_id) {
                    deferred.resolve(null);
                    return deferred.promise;
                }
                if (!currentUser2) {
                    deferred.resolve(false);
                    return deferred.promise;
                }
                $http({
                    method: 'get',
                    url: $rootScope.serverUrl + 'api/bookings/' + $stateParams.b_id
                }).then(function success(response) {
                    deferred.resolve(response.data);
                });
                return deferred.promise;
            }]
        }
    })
    .state('login', {
        url: "/login",
        templateUrl: "./app/login/login.html",
        controller: "loginCtrl",
        data: {
            pageTitle: 'Log in - Sign in', bodyClass: 'account separate-inputs'
//            permissions: {
//                except: ['anonymous'], redirectTo: 'login'
//            }
        },
        resolve: {
            loadPlugin: function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                    {
                        name: 'bookingOnCalendar',
                        files: [
                            './app/login/loginCtrl.js',
                            //require by MAKE theme - login page
                            './bower_components/jquery-backstretch/jquery.backstretch.min.js',
                            //require by MAKE theme
                            './bower_components/ladda/dist/ladda.min.js'
                        ]
                    }
                ]);
            }
        }
    })
    .state('sharing', {
        url: "/sharing?:invitation_token",
        templateUrl: "./app/book/sharing/sharing.html",
        controller: "sharingCtrl",
        controllerAs: "sharing",
        data: {
            // pageTitle: 'Log in - Sign in', bodyClass: 'account separate-inputs'
            // permissions: {
            //    except: ['anonymous'], redirectTo: 'login'
            // }
        },
        resolve: {
            loadPlugin: function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                    {
                        name: 'bookingOnCalendar',
                        files: [
                            './app/book/sharing/sharingCtrl.js'
                        ]
                    }
                ]);
            }
        }
    })
    ;
});
