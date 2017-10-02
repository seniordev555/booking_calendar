/* global recent_adr_mixers */

"use strict";

angular.module('newApp').controller('personnelCtrl', personnelCtrl);

personnelCtrl.$inject = ['$scope', 'currentUser', '$http', 'RegExp'];
function personnelCtrl($scope, currentUser, $http, RegExp) {
    var vm = this;

    vm.data = {};
    vm.user = currentUser.get();

    vm.removeSharedUser = removeSharedUser;
    vm.removeSharedEmail = removeSharedEmail;
    vm.addSharedEmail = addSharedEmail;
    vm.searchUsersForSharing = searchUsersForSharing;

    $scope.$on('event-modal-open', function (event, data) {
        // $scope.event_info is inherited from parent controller: manageBookingCtrl
        vm.booking = $scope.$parent.event_info;
        if (!vm.booking.personnel) {
            vm.booking.personnel = {};
            vm.booking.personnel.shared_users = [];
        }
        if (!vm.booking.personnel.shared_emails || !vm.booking.personnel.shared_emails.length) {
            vm.booking.personnel.shared_emails = [""];
        }
        init();
    });

    function init() {
        getAdrMixers();
        getSharedUsers();
    }

    function getAdrMixers() {
        $http.get(TXP.serverUrl + "users/adr-mixers").then(function (successResponse) {
            if (successResponse.data && successResponse.data.data) {
                var data = successResponse.data.data;
                vm.data.adr_mixers = data;
            }
        });
    }

    function getSharedUsers() {
        $http.get(TXP.serverUrl + "api/bookings/shared-users").then(function (successResponse) {
            if (successResponse.data && successResponse.data.data) {
                var data = successResponse.data.data;
                data.forEach(function(user) {
                    var filtered = vm.booking.personnel.shared_users.filter(function (shared_user) {
                        return shared_user.email == user.email;
                    });
                    if (filtered.length == 0) {
                        vm.booking.personnel.shared_emails.splice(0, 0, { id: user._id, value: user.email, shared: false });
                    }
                });
                setInputColorFollowingStatus();
            }
        });
    }

    function removeSharedUser($index) {
        vm.booking.personnel.shared_users.splice($index, 1);
    }

    function removeSharedEmail($index) {
        vm.booking.personnel.shared_emails.splice($index, 1);
    }

    function addSharedEmail() {
        vm.booking.personnel.shared_emails.push("");
        setInputColorFollowingStatus();
        setTimeout(function () {
            $(".sharing-textbox").last().focus();
        }, 100);
    }

    function setInputColorFollowingStatus () {
        setTimeout(function () {
            // this function is inherited from manageBookingCtrl
            $scope.$parent.setInputColorFollowingStatus();
        });
    }

    function searchUsersForSharing(val) {
        return $http.get(TXP.serverUrl + 'users/search', {
            params: {
                field: 'email',
                value: val
            }
        }).then(function(response) {
            return response.data.data.map(function(element) {
                var value = "";
                if (element.fullname && element.email) {
                    value = element.fullname + " (" + element.email + ")";
                }
                if (element.fullname && !element.email) {
                    value = element.fullname;
                }
                if (!element.fullname && element.email) {
                    value = element.email;
                }
                var shared = false;
                if (vm.booking.personnel.shared_users && vm.booking.personnel.shared_users.length) {
                    for (var i = 0; i < vm.booking.personnel.shared_users.length; i++) {
                        if (element._id == vm.booking.personnel.shared_users[i]._id) {
                            shared = true;
                            value += " - Shared";
                        }
                    };
                }
                if (!shared && element._id == vm.user._id) {
                    shared = true;
                    value += " - You";
                }
                return {id: element._id, value: value, shared: shared};
            });
        });
    };
}
