(function () {
    window.Tour = function (UserSettingService) {
        this.UserSettingService = UserSettingService;
        this.tourModal = $("#tour-modal");

        this.tourModal.modal({
            'backdrop' : 'static'
        });

        if( $(window).width() < 480 )
        {
            this.guideData = [
                {
                    elem: $(".fc-dropdownBtn-button"),
                    title: 'Dropdown',
                    intro: "Click here to see Add Hold/Booking and Today menu.",
                    step: 1
                },
                {
                    elem: $(".fc-prev-button"),
                    title: 'Navigate back',
                    intro: "Moves the calendar one step back (either by a month, week, or day)",
                    step: 3
                },
                {
                    elem: $(".fc-next-button"),
                    title: 'Navigate forward',
                    intro: "Moves the calendar one step forward (either by a month, week, or day).",
                    step: 4
                },
                {
                    elem: $(".setting-calendar"),
                    title: 'Change calendar view mode',
                    intro: "Click to change calendar view mode. You can set the starting of the calendar weeks to Sunday or Today.",
                    step: 5
                },
                {
                    elem: null,
                    title: 'Add booking by making a selection',
                    intro: "Click on an empty place or hold the mouse and drag to make a selection to add Book or Hold with a certain duration.",
                    step: 6,
                    cssOptions: {
                        top: "30%",
                        left: "25%",
                        width: "40px",
                        height: "20%"
                    }
                },
            ];
        } else {
            this.guideData = [
                {
                    elem: $(".fc-addBookingBtn-button"),
                    title: 'Add booking',
                    intro: "Click here to add a Booking. In popup dialog, fill the time you want to book.",
                    step: 1
                },
                {
                    elem: $(".fc-addHoldBtn-button"),
                    title: 'Add hold',
                    intro: "Click here to add a Hold. Please note that Holds can be taken by Bookings. Others can \"buy out\" your Hold and Book it.",
                    step: 2
                },
                {
                    elem: $(".fc-prev-button"),
                    title: 'Navigate back',
                    intro: "Moves the calendar one step back (either by a month, week, or day)",
                    step: 3
                },
                {
                    elem: $(".fc-next-button"),
                    title: 'Navigate forward',
                    intro: "Moves the calendar one step forward (either by a month, week, or day).",
                    step: 4
                },
                {
                    elem: $(".setting-calendar"),
                    title: 'Change calendar view mode',
                    intro: "Click to change calendar view mode. You can set the starting of the calendar weeks to Sunday or Today.",
                    step: 5
                },
                {
                    elem: null,
                    title: 'Add booking by making a selection',
                    intro: "Click on an empty place or hold the mouse and drag to make a selection to add Book or Hold with a certain duration.",
                    step: 6,
                    cssOptions: {
                        top: "30%",
                        left: "25%",
                        width: "40px",
                        height: "20%"
                    }
                },
            ];
        }
        

        this.addGuidelinePoints();

        this.bindEvents();
    }

    window.Tour.prototype.bindEvents = function() {
        var modal = this.tourModal;
        var dontShowTourKey = "dont_show_tour";
        var self = this;

        modal.find("#start-tour").click(function () {
            modal.modal('hide');
            introJs()
                .setOptions({
                    showStepNumbers: false,
                    showBullets: false
                })
                .oncomplete(function() {
                    if (self.UserSettingService) {
                        self.UserSettingService.set(dontShowTourKey, true);
                    }
                })
                .start();
            return false;
        });

        modal.on('hidden.bs.modal', function () {
            var dontShowTour = modal.find("[name=do_not_show_tour_again]").val();
            if (dontShowTour && self.UserSettingService) {
                self.UserSettingService.set(dontShowTourKey, true);
            }
        });
    };

    /**
 *      * bind intro.js attr to elements
 *           * if element not provided, create a fake element at a specific position and bind to it
 *                * @param {object} elem       jquery object
 *                     * @param {string} text       
 *                          * @param {int} step       
 *                               * @param {object} cssOptions - {top: top, left: left, width: width, height: height}
 *                                    */
    window.Tour.prototype.addGuidelinePoints = function() {
        
        for (var i = 0; i < this.guideData.length; i++) {
            var data = this.guideData[i];
            var elem = data.elem;
            if (!elem) {
                elem = $("<div></div>");
                elem.css($.extend({ position: 'absolute' }, data.cssOptions));
                $(".page-content").append(elem);
            }
            var intro = data.intro;
            if (data.title) {
                intro = "<h4 class='m-t-0 m-b-10'><strong>" + data.title + "</strong></h4>" + intro;
            }
            elem.attr("data-intro", intro);
            elem.attr("data-step", data.step);
        };
    }
})();
