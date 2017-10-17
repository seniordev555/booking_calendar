(function() {
'use strict';
angular.module('newApp').controller('calendarCtrl', calendarCtrl);

calendarCtrl.$inject = ['$scope', '$compile', '$http', 'currentUser', 'timeUtil', '$rootScope', '$uibModalStack', 'calendarUtil', 'LaddaLoadingService', 'UserSettings', 'settings', 'visitingBooking', 'bookingRenderHelper'];
function calendarCtrl($scope, $compile, $http, currentUser, timeUtil, $rootScope, $uibModalStack, calendarUtil, LaddaLoadingService, UserSettings, settings, visitingBooking, bookingRenderHelper) {
    var OPEN_MANAGE_BOOKING_MODAL_ACTIONS = {
        CLICK_EVENT: "click_event",
        CLICK_ADD_BOOKING_BUTTON: "click_add_booking_button",
        CLICK_ADD_HOLD_BUTTON: "click_add_hold_button",
        SELECT_RANGE: "select_range"
    };
    var calendar;
    var isLoggedIn = currentUser.isSet();
    $scope.isLoggedIn = isLoggedIn;
    var loggedInUser = currentUser.get();
    var isAdmin = currentUser.hasRole('admin');
    var defaultProfilePhoto = "http://simpleicon.com/wp-content/uploads/user1.png";
    var firstPageLoaded = true;
    var $modal = $('#booking-modal');

    if (isLoggedIn) {
        $scope.profilePhoto = loggedInUser.profilePhoto || defaultProfilePhoto;
        $scope.profileUrl = loggedInUser.profileUrl || "#";
    }
    $scope.tabs = {
        'manage-booking': {
            heading: 'Manage Booking',
            active: true
        },
        'technical-specifications': {
            heading: 'Technical Specifications',
            active: false
        },
        'event-log': {
            heading: 'Event Log',
            active: false
        },
        'personnel': {
            heading: 'Personnel',
            active: false
        },
        'billing': {
            heading: 'Billing',
            active: false
        }
    };
    $scope.emailNotifications = {
        "newSharedBooking": true,
        "bookingRemind": true,
        "bookingCreated": true,
        "bookingUpdated": true
    };
    if (loggedInUser && loggedInUser.emailNotifications) {
        $scope.emailNotifications = angular.copy(loggedInUser.emailNotifications);
    }
    $scope.switchCalendarWeekMode = switchCalendarWeekMode;
    $scope.saveNotificationSettings = saveNotificationSettings;

    function canUpdate(event) {
        if (event.can_update) {
            return true;
        }
        return false;
    }
    function loadBookings(start, end, timezone, callback) {
        var timezoneString = TXP.helpers.getTimezoneString();
        var startParam = start.set("hours", 0).set("minutes", 0).set("seconds", 0);
        startParam = timeUtil.formatDateServer(startParam);
        var endParam = end.set("hours", 0).set("minutes", 0).set("seconds", 0);
        endParam = timeUtil.formatDateServer(endParam);
        var params = { start: startParam, end: endParam };
        $http({
            method: 'get',
            url: $rootScope.serverUrl + 'api/bookings',
            params: params
        }).then(function (json) {
            var events = [];
            if (json.data && json.data.data) {
                var data = json.data.data;
                data.forEach(function (event) {
                    var start = timeUtil.convertServerDateToMoment(event.time_in);
                    var end = timeUtil.convertServerDateToMoment(event.time_out);
                    var editable = true;
                    var title = event.production;
                    if (!canUpdate(event)) {
                        editable = false;
                        //show booking status to anonymous
                        if (event.booking_status == 'Hold') {
                            title = "Hold";
                        } else {
                            title = "Booked";
                        }
                    }
                    if (!isAdmin && moment().isAfter(start, 'day')) {
                        editable = false;
                    }
                    var eventClassName = calendarUtil.setBookingClass(event);
                    if (visitingBooking && visitingBooking._id == event._id && firstPageLoaded) {
                        eventClassName += " highlighted";
                    }
                    events.push({
                        title: title,
                        start: start,
                        end: end,
                        more_info: event,
                        allDay: false,
                        className: eventClassName,
                        editable: editable
                    });
                });
                callback(events);
                // auto open manage booking modal at the first time the calendar is rendered
                if (visitingBooking && firstPageLoaded) {
                    setTimeout(function () {
                        $(".highlighted").trigger("click");
                    }, 1000);
                    firstPageLoaded = false;
                }
            }
        });
    }
    /**
     * add/edit booking modal will be opened when:
     *     - click on an event
     *     - make a selection in calendar
     *     - click add hold / add booking buttons
     * @param  {object} data
     * @param  {string} triggerAction - name of the action which trigger the open modal event - "click_event", "select_range", "click_add_hold_button", "click_add_booking_button"
     */
    function openAddBookingModal(data, triggerAction) {
        $scope.$apply(function () {
            $scope.tabs['manage-booking'].active = true;
        });
        calendar.fullCalendar('unselect');
        var start = "";

        var eventInitData = {
            calendar: calendar,
            loggedInUserProfilePhoto: $scope.profilePhoto,
            loggedInUserProfileUrl: $scope.profileUrl
        };
        var isAddNew = true;

        switch (triggerAction) {
            case OPEN_MANAGE_BOOKING_MODAL_ACTIONS.SELECT_RANGE:
                // add booking
                start = data.start;
                eventInitData.start = data.start;
                eventInitData.end = data.end;
                eventInitData.booking_status = "Book";
                break;
            case OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_ADD_HOLD_BUTTON:
                // Add booking
                eventInitData.booking_status = "Hold";
                break;
            case OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_ADD_BOOKING_BUTTON:
                // Add booking
                eventInitData.booking_status = "Book";
                break;
            case OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_EVENT:
                // Edit booking
                isAddNew = false;
                var editEvent = data.bookingEvent;
                start = editEvent.start;
                eventInitData.editEvent = editEvent;
                break;
        }

        eventInitData.isAddNew = isAddNew;

        //only admin can add/edit time in the past
        if (timeUtil.isAfterNow(start)  && !isAdmin) {
            return false;
        }

        if (!isAddNew && !canUpdate(editEvent.more_info)) {
            return false;
        }

        $rootScope.$broadcast('event-modal-open', eventInitData);

        $rootScope.$on('$locationChangeStart', function (event) {
            // $uibModalStack.dismissAll();
            $("#booking-modal").find("[data-dismiss='modal']").trigger("click");
            event.preventDefault();
        });

        $modal.modal({ backdrop: 'static' });
    }

    function prepareDropdownMenu() {
        var dropdownBtn = $('.fc-dropdownBtn-button');
        if(!dropdownBtn.hasClass('dropdown-toggle'))
        {
            dropdownBtn.addClass('dropdown-toggle');
            dropdownBtn.attr("data-toggle", "dropdown");
        }
        var toggleHtml = $('.fc-dropdown-toggle').html();
        if(toggleHtml == undefined)
        {
            toggleHtml =
                        '<ul class="dropdown-menu fc-dropdown-toggle">' +
                            '<li><a onClick="$(\'.fc-addHoldBtn-button\').trigger(\'click\'); return false;">Add Hold</a></li>' +
                            '<li><a onClick="$(\'.fc-addBookingBtn-button\').trigger(\'click\'); return false;">Add Booking</a></li>' +
                            '<li><a onClick="$(\'.fc-today-button\').trigger(\'click\'); return false;">Today</a></li>' +
                        '</ul>';
            $('.fc-right').append($(toggleHtml));
        }
    }

    function openConfirmationModal(event, delta, revertFunc, jsEvent, ui, view) {
        $scope.dragging = {};
        var modalBodyHtml = '';
        var modalBody = $("#drag-booking-modal").find(".modal-body");
        var modalFooter = $("#drag-booking-modal").find(".modal-footer");

        var newStart = moment(event.start).format("HH:mm");
        var newEnd = moment(event.end).format("HH:mm");
        modalBodyHtml += '<div class="text-center m-b-10">' + moment(event.start).format("ddd, MMM Do YYYY") + '</div>';
        modalBodyHtml += '<div class="text-center">Are you sure you want to change time to: </div>';
        modalBodyHtml += '<div class="text-center"><h2 class="w-500">' +
                            newStart + ' - ' + newEnd +
                        '</h2></div>';

        var undoButton = '<button ng-click="dragging.undo()" class="btn btn-link pull-right">Cancel</button>';
        var submitButton = '<button ng-hide="dragging.error" ng-click="dragging.submit()" class="btn btn-blue pull-right confirm-change-time ladda-button" data-style="slide-left"><span class="ladda-label">Submit</span></button>';
        var modalFooterHtml = undoButton + submitButton;
        modalBody.empty().html(modalBodyHtml);
        modalFooter.empty().html($compile(modalFooterHtml)($scope));
        $scope.dragging.submit = function () {
            var event_info = angular.copy(event.more_info, {});
            event_info.time_in = timeUtil.formatDateServer(timeUtil.formatDateClient(event.start));
            event_info.time_out = timeUtil.formatDateServer(timeUtil.formatDateClient(event.end));
            event_info.owner = event_info.owner._id;
            var loading = LaddaLoadingService.startLoadingButton(".confirm-change-time");
            $http.put($rootScope.serverUrl + "api/bookings/" + event_info._id, event_info).then(function (successResponse) {
                $("#drag-booking-modal").modal('hide');
            }, function (errorResponse) {
                modalBodyHtml = '<div class="alert alert-danger">Error change time: ' + errorResponse.data.error + '</div>';
                modalBody.empty().html(modalBodyHtml);
                modalFooterHtml = undoButton;
                modalFooter.html($compile(modalFooterHtml)($scope));
                revertFunc();
                LaddaLoadingService.stopLoadingButton(loading);
            });
        };
        $scope.dragging.undo = function () {
            revertFunc();
            $("#drag-booking-modal").modal('hide');
        };
        $scope.dragging.keyboardEvent = function (e) {
            // Escape key
            if (e.which == 27) {
                $scope.dragging.undo();
            }
            // Enter key
            if (e.which == 13) {
                $scope.dragging.submit();
            }
        };
        $("#drag-booking-modal").modal({backdrop: 'static', keyboard: false});
    }
    function renderBookingContent(event, element) {
        if (!event.more_info) {
            return;
        }
        if (visitingBooking && visitingBooking._id == event.more_info._id) {
            element.addClass("highlighted");
        }
        if (event.more_info.booking_status == 'Hold' && event.more_info.estimate) {
            element.find('.fc-content').append('<div class="estimate">Estimate: ' + event.more_info.estimate + ' hours</div>');
        }
        if (!canUpdate(event.more_info)) {
            return;
        }

        // Add start time resizer
        element.prepend('<div class="fc-resizer fc-start-resizer"></div>');

        // owner image
        var profilePhoto = defaultProfilePhoto,
            profileUrl = '#';
        if (event && event.more_info && event.more_info.owner) {
            if (event.more_info.owner.profilePhoto) {
                profilePhoto = event.more_info.owner.profilePhoto;
            }
            if (event.more_info.owner.profileUrl) {
                profileUrl = event.more_info.owner.profileUrl;
            }
        }
        var imageHtml = '<div class="pull-right">\n\
                            <a href="' + profileUrl + '" target="_blank" title="View profile">\n\
                                <img src="' + profilePhoto + '" class="img-sm img-circle">\n\
                            </a>\n\
                         </div>';
        var image = $(imageHtml);
        element.find('.fc-content').prepend(image);

        // shared people images
        var sharePeopleImagesHtml = bookingRenderHelper.getSharedPeopleImagesHtml(event);
        if (sharePeopleImagesHtml !== -1) {
            // enough room for shared people images
            image.append(sharePeopleImagesHtml);
        } else {
            // show a text with number of shared people
            element.find('.fc-content').append("<span class='f-11'>Shared with " + event.more_info.personnel.shared_users.length + " people</span>");
        }

        // share link
        var shareLinkWrapper = $('<div class="text-center m-t-5 event-image-container"></div>');
        var shareLink = $('<a class="share-link" href="" title="Share with more people"><i class="fa fa-user-plus"></i></a>');
        shareLinkWrapper.append(shareLink);
        image.append(shareLinkWrapper);

        // bind events
        shareLink.click(function () {
            // open manage booking modal
            openAddBookingModal({bookingEvent: event}, OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_EVENT);
            // with personnel tab pre-selected
            $scope.$apply(function () {
                $scope.tabs.personnel.active = true;
            });
            return false;
        });
        //not open modal when click links
        image.find('a').bind('click', function(e){
            e.stopPropagation();
        });
    }
    function windowResize(view) {
        var options = {};
        if ($(window).width() < 768){
            $('#calendar').fullCalendar( 'changeView', 'agendaDay' );
        } else {
            $('#calendar').fullCalendar( 'changeView', 'agendaWeek' );
        }
    }
    function showRemoveButton(event, jsEvent, view) {
        if (event.more_info && canUpdate(event.more_info)) {
            $scope.remove = {};
            var domElement = jsEvent.currentTarget;
            $(domElement).append('<div class="remove-button"><button class="btn btn-link"><span class="fa fa-trash"></span></button></div>');
            $('.remove-button').on('click', function (e) {
                e.stopPropagation();
                var $removeBookingModal = $("#remove-booking-modal");
                $removeBookingModal.modal();
                $scope.remove.submit = function () {
                    var loading = LaddaLoadingService.startLoadingButton(".confirm-remove-booking");
                    $http.delete($rootScope.serverUrl + "api/bookings/" + event.more_info._id).then(function (successResponse) {
                        calendar.fullCalendar('removeEvents', event._id);
                        $removeBookingModal.modal('hide');
                        if ($modal.data('bs.modal') && $modal.data('bs.modal').isShown) {
                            $modal.modal('hide');
                        }
                        LaddaLoadingService.stopLoadingButton(loading);
                    });
                }
            });
        }
    }
    function hideRemoveButton(event, jsEvent, view) {
        var domElement = jsEvent.currentTarget;
        $(domElement).find(".remove-button").remove();
    }

    function switchCalendarWeekMode(mode) {
        UserSettings.set('calendar_mode', mode);
        $scope.calendar_mode = mode;
        var options = calendar.fullCalendar('getView').options;
        var start = calendar.fullCalendar('getView').start;

        // keep button icons
        delete options.buttonText;

        // set first day of week
        if (mode == 'sunday') {
            options.firstDay  = 0;
        }
        if (mode == 'today') {
            options.firstDay = timeUtil.now().day();
        }

        if (start.day() == options.firstDay) {
            return;
        }

        // keep current view date
        if (start.day() < options.firstDay) {
            var delta = start.day() - options.firstDay;
            timeUtil.subtract(start, delta, 'days');
        }
        calendar.fullCalendar('destroy');
        calendar.fullCalendar(options);
        calendar.fullCalendar('gotoDate', start);
    }

    /**
     * init the full calendar
     */
    function runCalendar() {
        var $calendarElement = $('#calendar');
        var firstDay = timeUtil.now().day();
        var calendarMode = settings.calendar_mode;
        $scope.calendar_mode = calendarMode || 'today';
        if (calendarMode && calendarMode == 'sunday') {
            firstDay = 0;
        }
        calendar = $calendarElement.fullCalendar({
            defaultDate: getCalendarDefaultDate(),
            slotDuration: '00:15:00', /* If we want to split day time each 15minutes */
            allDaySlot: false,

            //show date at specified timezone
            firstDay: firstDay,
            now: timeUtil.now().format("YYYY-MM-DD HH:mm:ss"),

            scrollTime: "09:00:00",
            businessHours: {
                start: "09:00",
                end: "18:00",
                dow: [1,2,3,4,5]
            },
            defaultView: $(window).width() < 768 ? 'agendaDay' : 'agendaWeek',
            handleWindowResize: true,
            height: $(window).height() - 90,
            editable: isLoggedIn,
            customButtons: {
                addBookingBtn: {
                    text: 'Add Booking',
                    click: function () {
                        openAddBookingModal(null, OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_ADD_BOOKING_BUTTON);
                    }
                },
                addHoldBtn: {
                    text: 'Add Hold',
                    click: function () {
                        openAddBookingModal(null, OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_ADD_HOLD_BUTTON);
                    }
                },
                dropdownBtn: {
                    text: '+',
                    click: function() {
                        return;
                    }
                }
            },
            header: {
                left: '',
                center: isLoggedIn ? 'addHoldBtn prev title next addBookingBtn today' : 'prev title next today',
                right: isLoggedIn ? 'dropdownBtn' : ''
            },
            events: loadBookings,
            eventLimit: true, // allow "more" link when too many events
            eventClick: function (bookingEvent) {
                openAddBookingModal({bookingEvent: bookingEvent}, OPEN_MANAGE_BOOKING_MODAL_ACTIONS.CLICK_EVENT);
            },
            eventRender: renderBookingContent,
            eventMouseover: showRemoveButton,
            eventMouseout: hideRemoveButton,

            selectable: isLoggedIn,
            selectHelper: true,
            select: function (start, end) {
                var data = {start: start, end: end};
                openAddBookingModal(data, OPEN_MANAGE_BOOKING_MODAL_ACTIONS.SELECT_RANGE);
            },
            windowResize: windowResize,
            eventDrop: openConfirmationModal,
            eventResize: openConfirmationModal,
            viewRender: function () {
                //show today button if today is not in calendar
                var view = $calendarElement.fullCalendar('getView');
                var now = timeUtil.now();
                if (now < view.start || now > view.end ) {
                    $('.fc-today-button').show();
                } else {
                    $('.fc-today-button').hide();

                    var todayShortDayOfWeek = timeUtil.now().format("ddd").toLowerCase();

                    //Add Today to today text so "Sat 1/2" -> "Today Sat 1/2"
                    //the current logic assume that today is always the first day of the week
                    var todayHeaderEl = $('.fc-head .fc-' + todayShortDayOfWeek);
                    var todayHTML = "Today " + todayHeaderEl.html();

                    // Make Today standout
                    todayHeaderEl.html(todayHTML).addClass('f-16');
                }

                // add footer same as header
                var $calendarViewElement = $calendarElement.fullCalendar('getView').el;
                var thead = $calendarViewElement.find(".fc-head");
                var tfoot = $("<tfoot></tfoot");
                tfoot.append(thead.html());
                $calendarViewElement.append(tfoot);
            }
        });

        $('.fc-toolbar .fc-next-button, .fc-toolbar .fc-prev-button').on('click', function (e) {
            calendar.fullCalendar('removeEvents');
        });
    }

    runCalendar();

    prepareDropdownMenu();

    handleShowingTour();

    var modalClosedTime = 0;
    /**
     * Logic of website tour feature:
     *  - Only show if enable_tour_feature config setting is on
     *  - If user visit homepage through url #/booking/:
     *      - Show tour if user is loggedin
     *  - If user visit a booking directly through url #/booking/booking_id
     *      - If user is not logged in, show message require user to login.
     *      - User cannot update the booking: Show notification modal of not having enough permission, then after the modal is closed, the tour starts
     *      - User can update the booking: open edit booking modal then after the first time modal is closed, the tour starts
     *  - Once user complete the tour or user choose Don't show again option, the tour stop showing again
     */
    function handleShowingTour () {
        if (!TXP.enable_tour_feature) {
            return;
        }
        var visitBookingDirectly = visitingBooking ? true : false;
        var visitBookingDirectlyWithoutLoggingIn = (visitingBooking === false);
        var visitHomeRoute = (!visitingBooking && visitingBooking !== false);

        if (visitHomeRoute && isLoggedIn) {
            showTour();
        }
        if (visitBookingDirectlyWithoutLoggingIn) {
            $("#login-notification-modal").modal();
        }
        if (visitBookingDirectly) {
            if (!visitingBooking.can_update) {
                $("#not-have-permission-modal").on('hidden.bs.modal', function() {
                    showTour();
                }).modal();
            } else {
                $modal.on('hidden.bs.modal', function() {
                    if (!modalClosedTime) {
                        showTour();
                        modalClosedTime = 1;
                    }
                });
            }
        }
    }

    function showTour () {
        if (settings.dont_show_tour === null || settings.dont_show_tour === 'false') {
            setTimeout(function () {
                new window.Tour(UserSettings);
            }, 800);
        }
    }

    function getCalendarDefaultDate (visitingBooking) {
        if (visitingBooking) {
            return moment(visitingBooking.time_in);
        }
        return null;
    }

    function saveNotificationSettings() {
        var settings = angular.copy($scope.emailNotifications);
        $http.put(TXP.serverUrl + 'users/me', {emailNotifications: settings}).then( function (res) {
            // saved
        }, function (err) {
            // save settings error
        });
    }
}
})();
