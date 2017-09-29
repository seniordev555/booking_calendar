//Enable icheck (checkbox/radio custom theme) by using directive. Use jquery version break angular code.
//@link http://stackoverflow.com/questions/21246650/using-angularjs-directive-for-icheck-plugin
(function () {
    angular.module('newApp').directive('icheck', icheck);
    icheck.$inject = ['$timeout'];
    function icheck($timeout) {
        return {
            require: 'ngModel',
            link: function($scope, element, $attrs, ngModel) {
                return $timeout(function() {
                    var value;
                    value = $attrs['value'];

                    $scope.$watch($attrs['ngModel'], function(newValue){
                        $(element).iCheck('update');
                    })

                    return $(element).iCheck({
                        checkboxClass: 'icheckbox_square-blue',
                        radioClass: 'iradio_square-blue'

                    }).on('ifChanged', function(event) {
                        if ($(element).attr('type') === 'checkbox' && $attrs['ngModel']) {
                            $scope.$apply(function() {
                                return ngModel.$setViewValue(event.target.checked);
                            });
                        }
                        if ($(element).attr('type') === 'radio' && $attrs['ngModel']) {
                            return $scope.$apply(function() {
                                return ngModel.$setViewValue(value);
                            });
                        }
                    });
                });
            }
        };    
    }
})();

// Execute after ng-repeat is finished
// function executed is specified by value of attribute
(function () {
    angular.module('newApp').directive('ngRepeatFinish', ngRepeatFinish);
    
    ngRepeatFinish.$inject = ['$timeout'];
    function ngRepeatFinish($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$eval(attr.ngRepeatFinish);
                    });
                }
            }
        };
    }
})();


/*
 * Custom tooltip to update title on changing value of tooltip-custom-title attribute
 * For example: On EventLogs Tab: when we check Charge checkbox
 * tooltip title will be changed from "Uncharge" to "Charged"
 */
(function () {
    angular.module('newApp').directive('tooltipCustom', tooltipCustom);
    
    function tooltipCustom() {
        return {
            restrict: "A",
            link: function (scope, element, attr) {
                scope.$watch('item.isCharged', function (newValue) {
                    $(element).attr('title', attr.tooltipCustomTitle).tooltip('fixTitle');
                });
                $(element).tooltip({
                    title: attr.tooltipCustomTitle,
                    placement: 'top',
                    trigger: 'hover'
                })
            }
        };
    }
})();