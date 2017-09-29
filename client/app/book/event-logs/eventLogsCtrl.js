"use strict";

angular.module('newApp').controller('EventLogsCtrl', EventLogsCtrl);

EventLogsCtrl.$inject = ['$scope', 'currentUser']

function EventLogsCtrl ($scope, currentUser) {
    var eventLogs = this;
    
    // this function is inherited from manageBookingCtrl
    var setInputColorFollowingStatus = $scope.$parent.setInputColorFollowingStatus;
    
    eventLogs.isAdmin = currentUser.hasRole("admin");
    eventLogs.descriptions = getDefaultDescriptions();

    eventLogs.startEventLog = startEventLog;
    eventLogs.endEventLog = endEventLog;
    eventLogs.removeEvent = removeEvent;
    eventLogs.addCharge = addCharge;
    eventLogs.removeCharge = removeCharge;
    
    $scope.$on('event-modal-open', function (event, data) {
        eventLogs.isAddingEventLog = false;
        eventLogs.isEndedEventLog = [];
        // $scope.event_info is inherited from parent controller: manageBookingCtrl
        eventLogs.booking = $scope.$parent.event_info;
        if (eventLogs.booking.event_logs.length) {
            eventLogs.booking.event_logs.forEach(function (item, index) {
                eventLogs.isEndedEventLog[index] = true;
                if (!item.end_time) {
                    eventLogs.isEndedEventLog[index] = false;
                    eventLogs.isAddingEventLog = true;
                }
            });
        }
    });

    function startEventLog() {
        eventLogs.isAddingEventLog = true;
        if (!eventLogs.isAdmin) {
            return;
        }
        eventLogs.booking.event_logs.push(getEmptyEvent());
        var lastIndex = eventLogs.booking.event_logs.length - 1;
        eventLogs.isEndedEventLog[lastIndex] = false;
        setTimeout(function () {
            setInputColorFollowingStatus();
        });
    }
    
    function endEventLog(index) {
        eventLogs.isAddingEventLog = false;
        eventLogs.isEndedEventLog[index] = true;
        eventLogs.booking.event_logs[index].end_time = moment().format("MM-DD HH:mm A");
    }

    function removeEvent(index) {
        if (!eventLogs.isAdmin) {
            return;
        }
        eventLogs.booking.event_logs.splice(index, 1);
        if (! eventLogs.booking.event_logs.length) {
            eventLogs.isAddingEventLog = false;
        }
    }

    function getEmptyEvent () {
        return {
            start_time: moment().format("MM-DD HH:mm A"),
            end_time: "",
            description: "",
            is_billed: true
        };
    }
    
    function addCharge () {
        eventLogs.booking.additional_charges.push({
            amount: "",
            description: ""
        });
        setTimeout(function () {
            setInputColorFollowingStatus();
        });
    }

    function removeCharge (index) {
        eventLogs.booking.additional_charges.splice(index, 1);
    }
    
    function getDefaultDescriptions() {
        return [
            'Audition',
            'Break Actor',
            'Break Producer',
            'Cue',
            'Download',
            'Downtime (do not charge)',
            'Lunch (do not charge)',
            'Playback',
            'Print',
            'Record',
            'Setup',
            'Test Remote SC',
            'Test Remote Skype',
            'Waiting for Actor',
            'Waiting for Producer'
        ];
    }
}