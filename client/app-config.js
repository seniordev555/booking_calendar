var TXP = {
	settings: {
		timezone_string: "America/Los_Angeles" // use Los Angeles timezone with help of momentjs, so we can deal with daylight saving
	},
	enable_tour_feature: true
};
TXP.helpers = {};
TXP.helpers.getTimezoneString = function () {
    //return timezone in offset format
    //with Los Angeles, when daylight saving is on/off, we will have "-08:00" or "-07:00"
    return moment().tz(TXP.settings.timezone_string).format('Z');
};

TXP.serverUrl = "/source-connect/booking/";
