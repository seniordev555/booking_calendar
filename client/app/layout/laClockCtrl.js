(function() {
    'use strict';
    angular.module('newApp').controller('laClockCtrl', laClockCtrl);
    
    laClockCtrl.$inject = ['$timeout', '$scope'];
    function laClockCtrl($timeout, $scope) {
        //@todo: using -08 offset will not calculate daylight saving, we need to use timezone name
        //need to change in other place
        //@see: CBK-142 To support Daylight saving, change to use ""America/Los_Angeles" with moment-timezone

//        var d = moment().utcOffset("-0800");
//        $scope.date = d.format("ddd, Do MMMM YYYY");
        $scope.date = moment().tz("America/Los_Angeles").format("ddd, Do MMMM YYYY");        
        var tick = function() {
//			d = moment().utcOffset("-0800");
//            $scope.time = d.format("h:mm A");
            $scope.time = moment().tz("America/Los_Angeles").format("h:mm A");
            $timeout(tick, 1000);
        };
        tick();
    }
})();