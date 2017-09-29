(function () {
    angular.module('newApp').controller('BillingCtrl', billingCtrl);

    billingCtrl.$inject = ['$scope'];
    function billingCtrl($scope) {
        var vm = this;
        $scope.$on('event-modal-open', function (event, data) {
            // inherited from parent ctrl (manageBookingCtrl)
            vm.booking = $scope.$parent.event_info;
        });
    }
})();