"use strict";

angular.module('newApp').controller('manageBookingCtrl', manageBookingCtrl);

manageBookingCtrl.$inject = ['$scope', 'currentUser', '$http', 'timeUtil', 'calendarUtil', '$compile', '$rootScope', 'LaddaLoadingService']

function manageBookingCtrl ($scope, currentUser, $http, timeUtil, calendarUtil, $compile, $rootScope, LaddaLoadingService) {
    var $modal = $('#booking-modal');
    var editEvent;
    var isAdmin = currentUser.hasRole('admin');
    var calendar;
    var isLoggedIn = currentUser.isSet();
    var loggedInUser = currentUser.get();

    $scope.selectTab = selectTab;
    $scope.setInputColorFollowingStatus = setInputColorFollowingStatus;
    $scope.selectStatus = setInputColorFollowingStatus;
    $scope.setInputActors = setInputActors;
    $scope.plusOneActor = plusOneActor;
    $scope.removeActor = removeActor;
    $scope.cancelRemoveActor = cancelRemoveActor;
    $scope.bookingFormOnLoad = bookingFormOnLoad;
    $scope.openRemoveBookingModal = openRemoveBookingModal;
    $scope.manageBookingTabTemplateLoaded = manageBookingTabTemplateLoaded;

    function reset() {
        $scope.start = "";
        $scope.end = "";
        $scope.time_in = "";
        $scope.time_out = "";
        $scope.submitting = false;
        $scope.error = false;
        $scope.event_info = {
            actors: [],
            event_logs: [],
            additional_charges: []
        };
        editEvent = null;
    }
    reset();

    $scope.$on('event-modal-open', function(angularEvent, angularEventParams){
        manageBookingTabTemplateLoaded();
        $.validator.addMethod("validDate", function(value, element) {
            return this.optional(element) || timeUtil.convertClientDateToMoment(value).isValid();
        }, "Please provide the valid time!");
        setTimeout(function () {
            bindEvents();
        }, 100);
        if (angularEventParams.start) {
            $scope.start = angularEventParams.start;
            $scope.time_in = timeUtil.formatDateClient(angularEventParams.start);
        }

        if (angularEventParams.end) {
            $scope.end = angularEventParams.end;
            $scope.time_out = timeUtil.formatDateClient(angularEventParams.end);
        }

        if (angularEventParams.booking_status) {
            $scope.event_info.booking_status = angularEventParams.booking_status;
            $modal.find('select[name=booking_status]').prop("disabled", "disabled");
            setInputColorFollowingStatus();
        }
        else {
            $modal.find('select[name=booking_status]').prop("disabled", false);
        }

        $scope.isAddNew = angularEventParams.isAddNew;
        $scope.profilePhoto = angularEventParams.loggedInUserProfilePhoto
        $scope.profileUrl = angularEventParams.loggedInUserProfileUrl

        if (!angularEventParams.isAddNew) {
            editEvent = angularEventParams.editEvent;
            $scope.event_info = angular.copy(editEvent.more_info);
            if (!$scope.event_info.actors) {
                $scope.event_info.actors = [];
            }
            $scope.time_in = timeUtil.formatDateClient(editEvent.start);
            $scope.time_out = timeUtil.formatDateClient(editEvent.end);
            if (editEvent.more_info.owner && editEvent.more_info.owner.profileUrl) {
                $scope.profileUrl = editEvent.more_info.owner.profileUrl;
            }
            if (editEvent.more_info.owner && editEvent.more_info.owner.profilePhoto) {
                $scope.profilePhoto = editEvent.more_info.owner.profilePhoto;
            }
        }
        if (angularEventParams.calendar) {
            calendar = angularEventParams.calendar;
        }

        if ($scope.isAddNew) getLastBooking();
        else manageActors();
    });

    function getLastBooking() {
        $http.get(TXP.serverUrl + "api/bookings/last-booking").then(function (successResponse) {
            if (successResponse.data && successResponse.data.data) {
                var data = successResponse.data.data;
                $rootScope.$broadcast('booking.last_booking_received', { data: data });
            }
        });
    }

    $scope.$on('booking.last_booking_received', function(event, args) {
        var data = args.data;
        if (data) {
            $scope.event_info.production = data.production;
            $scope.event_info.post_production_name = data.post_production_name || '';
            $scope.event_info.post_production_phone = data.post_production_phone || '';
            $scope.event_info.post_production_email = data.post_production_email || '';
            $scope.event_info.notice = data.notice || '';
            $scope.event_info.billing = data.billing || {}
            if (data.technical_specifications) {
                var new_spec = {}, past_spec = angular.copy(data.technical_specifications);
                new_spec.sample_rate = past_spec.sample_rate;
                new_spec.frame_rate = past_spec.frame_rate;
                new_spec.preferred_microphones_boom = past_spec.preferred_microphones_boom;
                new_spec.lavalier = past_spec.lavalier;
                new_spec.instructions = past_spec.instructions;
                if(calendarUtil.getLocalOrRemoteActorAndDirectors().length > 0) {
                  new_spec.local_or_remote_actor_and_director = calendarUtil.getLocalOrRemoteActorAndDirectors()[0].value;
                }
                $scope.event_info.technical_specifications = new_spec;
            }
            manageActors();
            setInputActors();
        }
    });

    function manageActors() {
        //add an empty row for actors list
        if ($scope.event_info.actors) {
            var actors = $scope.event_info.actors;
            var addEmptyActor = false;
            //no actor yet, add empty actor
            if (actors.length == 0) {
                addEmptyActor = true;
            } else {
                //already has empty actor
                if (! _.find(actors, function(a){
                    //empty actor
                    return (!a.name || a.name == "");
                })) {
                    addEmptyActor = true;
                }
            }
            if (addEmptyActor) {
                plusOneActor(actors);
            }
        }
    }

    function setInputActors() {
        setInputColorFollowingStatus();
        $(".actor-start-time").timepicker({ stepMinute: 15 });
        $("[rel=popover]").each(function (index, element) {
            var confirmHtml = '<div><span class="m-b-10">Do you want to remove?</span><br>\n\
                                    <button ng-click="removeActor(' + index + ')" class="btn btn-danger btn-sm m-t-10">Yes</button>\n\
                                    <button ng-click="cancelRemoveActor()" class="btn btn-secondary btn-sm m-t-10">No</button>\n\
                            </div>';
            $(element).popover({
                container: '#booking-modal .modal-body',
                placement: 'bottom',
                triger: 'hover',
                html: true,
                content: function () {
                    return $compile(confirmHtml)($scope);
                },
                title: ''
            });
        });
        $("[rel=popover]").on("focusout", function () {
            $(this).popover('hide');
        });
    }

    function getActorTime (actors) {
        var timeInputs = $("[name='actor_start_time[]']");
        for (var i = 0; i < actors.length; i++) {
            actors[i].start_time = timeInputs.eq(i).val();
        };
        return actors;
    }

    function plusOneActor(actors) {
        actors.push({
            name: "",
            start_time: ""
        });
    }

    function removeActor(index) {
        var actors = $scope.event_info.actors;
        actors.splice(index, 1);
    };

    function cancelRemoveActor() {
        $("[rel=popover]").popover('hide');
    };

    function bookingFormOnLoad() {
        var validator = $modal.find('form').validate({
            success: "valid",
            submitHandler: submit,
            errorClass: "form-error",
            validClass: "success",
            errorElement: "div",
            ignore: [],
            rules: {
                time_in: {
                    validDate: true
                },
                time_out: {
                    validDate: true
                }
            },
            highlight: function (element, errorClass, validClass) {
                $(element).closest('.form-control').addClass(errorClass).removeClass(validClass);
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).closest('.form-control').removeClass(errorClass).addClass(validClass);
            },
            errorPlacement: function (error, element) {
                if (element.hasClass("custom-file") || element.hasClass("checkbox-type") || element.hasClass("language")) {
                    element.closest('.option-group').after(error);
                }
                else if (element.is(":radio") || element.is(":checkbox")) {
                    element.closest('.option-group').after(error);
                }
                else if (element.parent().hasClass('input-group')) {
                    element.parent().after(error);
                }
                else {
                    error.insertAfter(element);
                }
            },
            invalidHandler: function (event, validator) {
                if (validator.errorList.length) {
                    var firstErrorDomElement = validator.errorList[0].element;
                    var tabContentId = $(firstErrorDomElement).parents('ng-include:first').attr('id');
                    var tabs = $scope.$parent.tabs;
                    $.each(tabs, function (key, tab) {
                        tab.active = false;
                        if ('tab-content-' + key == tabContentId) {
                            tab.active = true;
                        }
                    });
                }
            }
        });

        $modal.on('hidden.bs.modal', function(){
            reset();
            validator.resetForm();
            $('.form-control').removeClass("success").removeClass("form-error");
            $('.form-control').removeClass('event-book').removeClass('event-hold');
        });
    };

    function submit () {
        var newEventInfo = angular.copy($scope.event_info, {});
        newEventInfo.time_in = timeUtil.formatDateServer($scope.time_in);
        newEventInfo.time_out = timeUtil.formatDateServer($scope.time_out);
        if (!newEventInfo.food_request && newEventInfo.food_request_details) {
            delete newEventInfo.food_request_details;
        }
        if (newEventInfo.actors && newEventInfo.actors.length) {
            newEventInfo.actors = getActorTime(newEventInfo.actors);
            // remove empty elements
            newEventInfo.actors = newEventInfo.actors.filter(function (actor) {
                return actor.name.trim() != "";
            });
            if (!newEventInfo.actors.length) {
                delete newEventInfo.actors;
            }
        }
        if (newEventInfo.event_logs && newEventInfo.event_logs.length) {
            // clean log data
            newEventInfo.event_logs = newEventInfo.event_logs.filter(function (log) {
                return log.description.trim() != "";
            });

            if (!newEventInfo.event_logs.length) {
                delete newEventInfo.event_logs;
            }
        }
        if (newEventInfo.additional_charges && newEventInfo.additional_charges.length) {
            // clean log data
            newEventInfo.additional_charges = newEventInfo.additional_charges.filter(function (charge) {
                return charge.description.trim() != "" || charge.amount.trim() != "";
            });

            if (!newEventInfo.additional_charges.length) {
                delete newEventInfo.additional_charges;
            }
        }
        // sharing - newEventInfo.personnel.shared_emails array contains both string elements for new people
        // and object elements for people which already are members
        if (newEventInfo.personnel.shared_emails && newEventInfo.personnel.shared_emails.length) {
            // share with users
            var sharedUsers = newEventInfo.personnel.shared_emails.filter(function (item) {
                return angular.isObject(item);
            });
            if (sharedUsers.length) {
                if (!newEventInfo.personnel.shared_users) {
                    newEventInfo.personnel.shared_users = [];
                }
                for (var i = 0; i < sharedUsers.length; i++) {
                    var user = sharedUsers[i];
                    if (newEventInfo.personnel.shared_users.indexOf(user.id) === -1) {
                        newEventInfo.personnel.shared_users.push(user.id);
                    }
                };
            }
            // share with new people
            newEventInfo.personnel.shared_emails = newEventInfo.personnel.shared_emails.filter(function (item) {
                if (!angular.isObject(item)) {
                    item = item.trim();
                    return item;
                } else {
                    return false;
                }
            });
        }
        $scope.submitting = true;

        // Create a new instance of ladda for the specified button
        var loading = LaddaLoadingService.startLoadingButton(".submit-button");

        var notificationOptions = {
            text: '<div class="alert alert-success bg-primary media fade in m-0">You have created successfully!</div>',
            animation: {
                open: 'animated flipInX',
                close: 'animated flipOutX',
                easing: 'swing',
                speed: 200
            },
            layout: 'top',
            timeout: '2000'
        };

        if (editEvent) {
            $http.put($rootScope.serverUrl + "api/bookings/" + newEventInfo._id, newEventInfo).then(function (successResponse) {
                $scope.error = false;
                var data = successResponse.data;
                // sync calendar booking data with updated data
                editEvent.title = data.production;
                editEvent.start = timeUtil.convertServerDateToMoment(data.time_in);
                editEvent.end = timeUtil.convertServerDateToMoment(data.time_out);
                editEvent.more_info = data;
                editEvent.className = calendarUtil.setBookingClass(data);
                // update calendar view
                calendar.fullCalendar('updateEvent', editEvent);
                $modal.modal('hide');
                reset();
                LaddaLoadingService.stopLoadingButton(loading);
            }, function (errorResponse) {
                $scope.error = true;
                $scope.time_error = errorResponse.data.error;
                $scope.submitting = false;
                LaddaLoadingService.stopLoadingButton(loading);
            });
        }
        else {
            $http.post($rootScope.serverUrl + "api/bookings", newEventInfo).then(function (successResponse) {
                $scope.error = false;
                if (isLoggedIn) {
                    newEventInfo.owner = {_id: loggedInUser.id};
                }
                calendar.fullCalendar('renderEvent', {
                    title: newEventInfo.production,
                    start: timeUtil.convertClientDateToMoment($scope.time_in),
                    end: timeUtil.convertClientDateToMoment($scope.time_out),
                    more_info: successResponse.data,
                    allDay: false,
                    className: calendarUtil.setBookingClass(newEventInfo)
                }, true);
                $modal.modal('hide');
                noty({
                    text: '<div class="alert alert-success bg-primary media fade in m-0 text-center">Thank you for booking, you will receive your confirmation email immediately.</div>',
                    animation: {
                        open: 'animated flipInX',
                        close: 'animated flipOutX',
                        easing: 'swing',
                        speed: 200
                    },
                    layout: 'top',
                    timeout: '2000'
                });
                reset();
                LaddaLoadingService.stopLoadingButton(loading);
            }, function (errorResponse) {
                $scope.error = true;
                $scope.time_error = errorResponse.data.error;
                $scope.submitting = false;
                LaddaLoadingService.stopLoadingButton(loading);
            });
        }
    }

    function openRemoveBookingModal(event) {
        $("#remove-booking-modal").modal();
    };

    function manageBookingTabTemplateLoaded() {
        var datetimepickerOptions = {
            dateFormat: 'D, dd/mm/yy',
            timeFormat: 'HH:mm',
            minDate: isAdmin ? "" : "0",
            stepMinute: 15,
            showButtonPanel: false,
            autoclose: true
            // onClose: function (date, inst) {
            //     if (date) {
            //         $modal.find("input[name=time_out]").focus();
            //     }
            // }
        };
        $modal.find("input[name=time_in]").datetimepicker(datetimepickerOptions).on('change', function (e) {
            $scope.time_in = $(e.target).val();
        });
        $modal.find("input[name=time_out]").datetimepicker(datetimepickerOptions).on('change', function (e) {
            $scope.time_out = $(e.target).val();
        });
    };

    function setInputColorFollowingStatus() {
        var selectedStatus = $scope.event_info.booking_status;
        if (selectedStatus == 'Hold') {
            $('.form-control').removeClass('event-book').addClass('event-hold');
        }
        if (selectedStatus == 'Book') {
            $('.form-control').addClass('event-book').removeClass('event-hold');
        }
    };

    function selectTab (tabName) {
        var container = $(".modal-buttons-container");
        var submitButton = container.find(".submit-button");
        var removeButton = container.find(".remove-button");
        if (tabName == 'event-log' && !isAdmin) {
            submitButton.hide();
            removeButton.hide();
        }
        if (tabName != 'event-log' && !isAdmin) {
            submitButton.show();
            removeButton.show();
        }
    }

    function bindEvents () {
        // Make <NULL> value fields very faint so the eye can focus in on what does have inputed data when edit booking
        $("input:not([type='checkbox'], [type='radio'], [name='end_time']), select, textarea:not([name='request_for_food_instruction'])").each(function () {
            var $elem = $(this);
            if ($scope.isAddNew) {
                $elem.css({
                    'opacity': 1
                });
                return;
            }
            $elem.keyup(function () {
                var value = $elem.val();
                if (!value) {
                    $elem.css({
                        'opacity': 0.5
                    });
                } else {
                    $elem.css({
                        'opacity': 1
                    });
                }
            }).trigger("keyup");
        });
    }

    $scope.openProfile = function() {
        if(!!$scope.profileUrl && $scope.profileUrl != '#') {
            window.open( $scope.profileUrl, '_blank' );
        }
    }

    $scope.searchActorsForProduction = function(search_term) {
        var production = $scope.event_info.production;
        return $http.get(TXP.serverUrl + 'api/bookings/search-actors', {
            params: {
                production: production,
                name: search_term
            }
        }).then(function(response) {
            return response.data.data;
        });
    };
}
