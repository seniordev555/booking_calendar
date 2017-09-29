(function() {
    angular.module('newApp')
        .factory('currentUser', currentUser)
    ;
    
    currentUser.$inject = ['$rootScope'];
    function currentUser($rootScope) {
        var save = function (user) {
            $rootScope.loggedInUser = user;
        };
        
        var clear = function() {
            delete $rootScope.loggedInUser;
        };
        
        var get = function () {
            return $rootScope.loggedInUser;
        };
        
        var isSet = function () {
            if ($rootScope.loggedInUser) {
                return true;
            }
            return false;
        }
        
        var hasRole = function(roleName) {            
            if ($rootScope.loggedInUser && $rootScope.loggedInUser.role && roleName == $rootScope.loggedInUser.role) {
                return true;
            }
            return false;
        }
        
        var getRole = function() {
            if ($rootScope.loggedInUser 
                    && $rootScope.loggedInUser.roles 
                    && $rootScope.loggedInUser.roles.length
                    && $rootScope.loggedInUser.roles.length > 0
            ) {
                for(var i = 0, len = $rootScope.loggedInUser.roles.length; i < len; i++) {
                    var role = $rootScope.loggedInUser.roles[i];
                    if (role) {
                        return role;
                    }
                }
            }
            return false;
        }

        var addAuthorizationToken = function (url) {
            var combinator = "&";
            if (url.indexOf("?") === -1) {
                combinator = "?";
            }
            if (localStorage.getItem("web_token")) {
                url += combinator + "access_token=" + localStorage.getItem("web_token");
            }
            return url;
        }
        
        return {
            save: save,
            clear: clear,
            get: get,
            isSet: isSet,
            hasRole: hasRole,
            getRole: getRole,
            addAuthorizationToken: addAuthorizationToken
        };
    }


})();

(function() {
    angular.module('newApp')
        .factory('timeUtil', timeUtil)
    ;
    
    function timeUtil() {
        /**
         * Current time at default timezone
         * 
         * @returns moment object
         */
        function now() {
            return moment().utcOffset(TXP.helpers.getTimezoneString());
        };
        
        /**
         * Check if a time is in the past.
         * Compare with now at specified timezone
         * 
         * @param moment time object time
         * @returns boolean
         */
        function isAfterNow(time) {
            //empty time is considered future time
            if (!time || !time.format) {
                return false;
            }
            
            //remove timezone info before compare
            if (time) {
                var time = time.format("YYYY-MM-DD HH:mm:ss");
                var currentTime = now().format("YYYY-MM-DD HH:mm:ss");
                return moment(currentTime).isAfter(time);
            }
        }
        
        /**
         * add support work with minus number in moment.subtract()
         * 
         * @param momentObject moment
         * @param int amount
         * @param string interval
         * days/hours/minutes
         */
        function subtract(moment, amount, interval) {
            if (amount >= 0) {
                moment.subtract(amount, interval);
            } else {
                amount = -amount;
                moment.add(amount, interval)
            }
        }
        
        function formatDateServer(date) {
            var momentObj = moment(date, 'ddd, DD/MM/YYYY HH:mm');
            // add system timezone string before sending to server
            return moment(momentObj).format("YYYY-MM-DD HH:mm:ss") + " " + TXP.helpers.getTimezoneString();
        }
        
        function convertServerDateToMoment(string) {
            // date data got from server has timezone 00:00
            // need to convert it to system timezone (PST, -08:00) to display
            return moment(string, "YYYY-MM-DD HH:mm:ss Z").utcOffset(TXP.helpers.getTimezoneString());
        }
        
        function formatDateClient(date) {
            var momentObj = date;
            if (typeof date == 'string') {
                momentObj = moment(date, 'YYYY-MM-DD HH:mm:ss');
            }
            return moment(momentObj).format("ddd, DD/MM/YYYY HH:mm");
        }
        
        function convertClientDateToMoment(string) {
            return moment(string, "ddd, DD/MM/YYYY HH:mm");
        }
            
        return {
            now: now,
            isAfterNow: isAfterNow,
            formatDateServer: formatDateServer,
            convertServerDateToMoment: convertServerDateToMoment,
            formatDateClient: formatDateClient,
            convertClientDateToMoment: convertClientDateToMoment,
            subtract: subtract
        };
    }


})();


(function() {
    angular.module('newApp')
        .factory('calendarUtil', calendarUtil)
    ;
    
    calendarUtil.$inject = ['currentUser'];    
    function calendarUtil(currentUser) {
        /**
         * Current time at default timezone
         * 
         * @returns moment object
         */
        function setBookingClass(event) {
            var loggedInUser = currentUser.get();
            if (event.booking_status == "Hold") {
                return "bg-yellow";
            }
            if (event.booking_status == "Book") {
                if (loggedInUser && event.owner._id == loggedInUser.id) {
                    return "bg-green";
                }
                else {
                    return "bg-red";
                }
            }
        };
        
            
        return {
            setBookingClass: setBookingClass
        };
    }


})();

(function () {
    angular.module('newApp').factory('RegExp', regExp);
    
    function regExp() {
        return {
            validateEmail: function (email) {
                var re = /\S+@\S+\.\S+/;
                return re.test(email);
            }
        };
    }
})();

(function () {
    angular.module('newApp').factory('LaddaLoadingService', laddaLoadingService);
    
    function laddaLoadingService() {

        function startLoadingButton (selector) {
            var loading = Ladda.create( document.querySelector( selector ) );
            // Start loading effect
            loading.start();
            return loading;
        }

        function stopLoadingButton (loading) {
            // Stop loading
            loading.stop();
            // Delete the button's ladda instance
            loading.remove();
        }
        return {
            startLoadingButton: startLoadingButton,
            stopLoadingButton: stopLoadingButton
        };
    }
})();

(function () {
    angular.module('newApp').factory('UserSettings', UserSettings);
    
    UserSettings.$inject = ['$http', '$q', 'currentUser'];

    function UserSettings($http, $q, currentUser) {
        var user = currentUser.get();
        var settingPrefix = "";
        if (user) {
            settingPrefix = currentUser.get()._id + "---";
        }
        function get (key) {
            var deferred = $q.defer();
            var setting = localStorage.getItem(settingPrefix + key);
            if (setting) {
                deferred.resolve(setting);
            } else {
                $http({
                    method: 'get',
                    url: TXP.serverUrl + "users/settings",
                    params: {
                        key: key
                    }
                }).then(function success(response) {
                    deferred.resolve(response.data.data);
                }, function error () {
                    deferred.resolve(null);
                });
            }
            return deferred.promise;
        }

        function set (key, value) {
            localStorage.setItem(settingPrefix + key, value);
            $http({
                method: 'put',
                url: TXP.serverUrl + "users/settings",
                data: {
                    key: key,
                    value: value
                }
            });
        }
        return {
            get: get,
            set: set
        };
    }
})();

(function() {
    'use strict';

    angular
        .module('newApp')
        .factory('bookingRenderHelper', bookingRenderHelper);

    bookingRenderHelper.$inject = [];

    /* @ngInject */
    function bookingRenderHelper() {
        var service = {
            getSharedPeopleImagesHtml: getSharedPeopleImagesHtml
        };
        return service;

        /**
         * build html for display images of people which be shared an event
         *
         * @method     getSharedPeopleImagesHtml
         * @param      {object}  calendarEvent
         */
        function getSharedPeopleImagesHtml (calendarEvent) {
            var bookingEvent = calendarEvent.more_info;
            if (!calendarEvent.start || !calendarEvent.end || !bookingEvent.personnel || !bookingEvent.personnel.shared_users || !bookingEvent.personnel.shared_users.length) {
                return "";
            }
            var html = "";
            var duration = getBookingDurationInHours(calendarEvent);
            // in UI, by the height of 0.6 hour is enough room for us to display one image
            // minus 3 because one for owner image, one for add user button and the other for more people indicator
            var maxNumberOfImagesCanShow = duration / 0.6 - 3;
            if (maxNumberOfImagesCanShow < 0 && bookingEvent.personnel.shared_users.length) {
                // in case of not enough room to show shared people image, we return a certain value
                // show the caller know to show a text with number of shared people or handle in another way
                return -1;
            }
            var moreUsers = [];
            bookingEvent.personnel.shared_users.forEach(function (user, i) {
                // in case of enough room to show shared people image, only display one and add an indicator for others
                if (maxNumberOfImagesCanShow > 1 && i == 0) {
                    html += getEventProfileImageHtml(user);
                } else {
                    moreUsers.push(user);
                }
            });
            if (maxNumberOfImagesCanShow > 0 && bookingEvent.personnel.shared_users.length > 1) {
                var number = bookingEvent.personnel.shared_users.length;
                if (maxNumberOfImagesCanShow > 1) {
                    number = number - 1;
                }
                // add more people indicator
                html += getMorePeopleIndicatorHtml(number, moreUsers);
            }
            return html;
        }

        /**
         * avatar html of one shared person
         */
        function getEventProfileImageHtml (userInfo) {
            var elem = $("<div>");
            elem.append('<div class="event-image-container"></div>');
            if (userInfo.profileUrl && userInfo.profilePhoto) {
                var htmlTitle = "View profile";
                if (userInfo.fullname) {
                    htmlTitle += " " + userInfo.fullname;
                } else if (userInfo.email) {
                    htmlTitle += " " + userInfo.email;
                }

                var profileLink = $("<a>");
                profileLink.attr("href", userInfo.profileUrl);
                profileLink.attr("target", "_blank");
                profileLink.attr("title", htmlTitle);
                
                var profileImage = $("<img class='img-sm img-circle'>");
                var profileImageUrl = "http://simpleicon.com/wp-content/uploads/user1.png"; // default avatar
                if (userInfo.profilePhoto) {
                    profileImageUrl = userInfo.profilePhoto;
                }
                profileImage.attr("src", profileImageUrl);

                profileLink.append(profileImage);

                elem.find(".event-image-container").append(profileLink);
            } else {
                var shortName = getShortName(userInfo);
                elem.find(".event-image-container")
                    .addClass("bg-orange")
                    .append("<span title='" + userInfo.email + "'>" + shortName + "</span>");
            }
            return elem.html();
        }

        function getMorePeopleIndicatorHtml (number, moreUsers) {
            return '<div class="event-image-container bg-orange">\n\
                        <span>+' + number + '</span>\n\
                    </div>';
        }

        /**
         * return the first letter of user email or first letters of fullname in upper case
         */
        function getShortName (userInfo) {
            if (userInfo.fullname) {
                var parts = userInfo.fullname.split(" ");
                var shortName = "";
                parts.forEach(function (part) {
                    shortName += part.charAt(0).toUpperCase();
                })
                return shortName;
            }
            return userInfo.email.charAt(0).toUpperCase();
        }

        function getBookingDurationInHours (calendarEvent) {
            var duration = moment.duration(calendarEvent.end.diff(calendarEvent.start));
            return duration.asHours();
        }
    }
})();