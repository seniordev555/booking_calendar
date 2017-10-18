(function () {
    angular.module('newApp').controller('TechnicalSpecificationsCtrl', technicalSpecificationsCtrl);

    technicalSpecificationsCtrl.$inject = ['$scope', '$compile', '$rootScope'];
    function technicalSpecificationsCtrl($scope, $compile, $rootScope) {
        var vm = this;
        vm.isRemoteClient = false;
        vm.localOrRemoteActorAndDirectorOptions = [
            {title: 'Local Actor & Director', value: 'local_actor_director'},
            {title: 'Local Actor with Remote Director', value: 'local_actor_with_remote_director'},
            {title: 'Local Director with Remote Actor', value: 'local_director_with_remote_actor'}
        ];
        vm.availableRemoteClients = [
            {title: 'Source Connect', value: 'source_connect'},
            {title: 'Skype', value: 'skype'},
            {title: 'Phone Patch', value: 'phone_patch'},
            {title: 'Web Camera', value: 'web_camera'}
        ];
        vm.localClient = {title: 'Local', value: 'local'};
        vm.deliverables = [];
        vm.sampleRates = getSampleRates();
        vm.frameRates = getFrameRates();
        vm.microphones = getDefaultMicrophonesBoom();
        vm.removeDeliverable = removeDeliverable;
        vm.addDeliverable = addDeliverable;
        vm.markDoneAllDeliverables = markDoneAllDeliverables;
        vm.assignDeliverables = assignDeliverables;
        vm.acceptEditContentDeliverables = acceptEditContentDeliverables;
        vm.showInputContentDeliverables = showInputContentDeliverables;
        vm.cancelEditContentDeliverables = cancelEditContentDeliverables;
        vm.updateClientTechs = updateClientTechs;

        $scope.$on('event-modal-open', function (event, data) {
            // $scope.event_info is inherited from parent controller: manageBookingCtrl
            vm.booking = $scope.$parent.event_info;
            vm.selectedClients = {};
            vm.isRemoteClient = isThereRemoteClient();
            if (!vm.booking.technical_specifications) {
                vm.booking.technical_specifications = {
                    local_or_remote_actor_and_director : 'local_actor_director'
                };
                vm.deliverables = getDefaultDeliverables();
                assignDeliverables();
                return;
            }
            if (vm.booking.technical_specifications.clients && vm.booking.technical_specifications.clients.length) {
                var clients = vm.booking.technical_specifications.clients;
                for (var i = 0, l = clients.length; i < l; i++) {
                    var client = clients[i];
                    vm.selectedClients[client.value] = true;
                }
            }
            if (vm.booking.technical_specifications.deliverables) {
                vm.deliverables = vm.booking.technical_specifications.deliverables;
                isDoneAllDeliverables();
            }
            vm.microphones = getDefaultMicrophonesBoom();
        });

        function updateClientTechs () {
            var clients = [];
            vm.isRemoteClient = isThereRemoteClient();
            if (vm.isRemoteClient) {
                vm.availableRemoteClients.forEach(function (obj) {
                    var key = obj.value;
                    if (vm.selectedClients[key]) {
                        clients.push(obj);
                    }
                });
            }
            vm.booking.technical_specifications.clients = clients;
        }

        // Remove deliverable
        function removeDeliverable(deliverableIndex) {
            vm.deliverables.splice(deliverableIndex, 1);
            assignDeliverables();
        }

        // Add one deliverable
        function addDeliverable() {
            for (var i = 0, l = vm.deliverables.length; i < l; i++) {
                if (!vm.deliverables[i].content) {
                    return;
                }
            }
            vm.deliverables.push({content: "(New Task)", done: false});
            vm.allDeliverablesDone = false;
            setTimeout(function () {
                showInputContentDeliverables(vm.deliverables.length - 1);
            });
            assignDeliverables();
        }

        // Set all deliverable done
        function markDoneAllDeliverables(jsEvent) {
            if (vm.allDeliverablesDone) {
                vm.deliverables.forEach(function (elem) {
                    elem.done = true;
                });
            }
            else {
                vm.deliverables.forEach(function (elem) {
                    elem.done = false;
                });
            }
            assignDeliverables();
        }

        // Check if all deliverables are done
        function isDoneAllDeliverables() {
            vm.allDeliverablesDone = true;
            for (var i = 0, l = vm.deliverables.length; i < l; i++) {
                if (!vm.deliverables[i].done) {
                    vm.allDeliverablesDone = false;
                    break;
                }
            }
        }

        // Assign deliverables to save data
        function assignDeliverables() {
            vm.booking.technical_specifications.deliverables = vm.deliverables;
            isDoneAllDeliverables();
        }

        // Show an input to edit deliverable's content
        function showInputContentDeliverables(deliverableIndex) {
            var index = deliverableIndex;
            var oldValue = vm.deliverables[index].content;
            var domItem = $('.todo-list li#task-' + index);
            var target = domItem.find('span.todo-task');
            $('span.todo-task').each(function (index, ele) {
                if ($(ele).data('bs.popover')) {
                    $(ele).popover('destroy');
                }
            });
            if (!domItem.hasClass('done')) {
                $(target)
                        .popover({
                            html: true,
                            content: function () {
                                var html = '<textarea autofocus id="deliverables-content-' + index + '" style="width:100%" ng-model="vm.deliverables[' + index + '].content" rows="3"></textarea><br>';
                                html += '<a class="m-t-5 btn btn-primary btn-sm" ng-click="vm.acceptEditContentDeliverables(' + index + ')">\n\
                                    <i class="glyphicon glyphicon-ok"></i>\n\
                                </a>';
                                html += '<a class="m-t-5 btn btn-default btn-sm" ng-click="vm.cancelEditContentDeliverables(' + index + ', \'' + oldValue + '\')">\n\
                                    <i class="glyphicon glyphicon-remove"></i>\n\
                                </a>';
                                return $compile(html)($scope);
                            },
                            placement: 'bottom'
                        })
                        .popover('show')
                        .on('shown.bs.popover', function (e) {
                            $('textarea#deliverables-content-' + index).select();
                        });
            }
        }

        // Submit the new deliverable's content
        function acceptEditContentDeliverables(deliverableIndex) {
            $('.todo-list li#task-' + deliverableIndex).find('span.todo-task').popover('destroy');
            assignDeliverables();
        }

        // Cancel edit deliverable's content
        function cancelEditContentDeliverables(deliverableIndex, oldValue) {
            vm.deliverables[deliverableIndex].content = oldValue;
            $('.todo-list li#task-' + deliverableIndex).find('span.todo-task').popover('destroy');
            assignDeliverables();
        }

        function getDefaultDeliverables () {
            return [
                {content: "Download Pix and Guide Tracks", done: false},
                {content: "Download and Print Cue Sheets", done: false},
                {content: "Prepare Beeps for Sessions", done: false}
            ];
        }

        function getDefaultMicrophonesBoom(search) {
            return $rootScope.adminSettings.microphones || [];
        }

        function getSampleRates () {
            return ['48', '96', '192'];
        }

        function getFrameRates () {
            return ['23.976', '24', '25'];
        }

        function isThereRemoteClient () {
            return (
                vm.booking.technical_specifications &&
                vm.booking.technical_specifications.local_or_remote_actor_and_director &&
                vm.booking.technical_specifications.local_or_remote_actor_and_director !== 'local_actor_director'
            );
        }
    }
})();
