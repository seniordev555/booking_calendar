'use strict';
angular.module('newApp').controller('sharingCtrl', sharingCtrl);

sharingCtrl.$inject = ['$stateParams'];
function sharingCtrl($stateParams) {
    var sharing = this;
    var token = $stateParams.invitation_token;

    sharing.facebookActivationUrl = TXP.serverUrl + "auth/facebook?invitation_token=" + token;
    sharing.googleActivationUrl = TXP.serverUrl + "auth/google?invitation_token=" + token;
    sharing.linkedinActivationUrl = TXP.serverUrl + "auth/linkedin?invitation_token=" + token;
}