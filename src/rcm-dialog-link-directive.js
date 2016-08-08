/**
 * RcmDialog.rcmDialogLink
 */
angular.module('RcmDialog').directive(
    'rcmDialogLink',
    [
        '$log',
        function ($log) {

            var thisLink = function (scope, elm, attrs, ctrl) {

                var rcmDialogId = null;

                if (attrs.rcmDialogId) {
                    rcmDialogId = attrs.rcmDialogId;
                } else {
                    rcmDialogId = rcmGuid.generate();
                }

                if (RcmDialog.hasDialog(rcmDialogId)) {
                    $log.warn('Duplicate dialog with id ' + rcmDialogId + ' has been created, some dialogs will not work correctly.');
                }

                var rcmDialogTitle = "Dialog";

                if (attrs.rcmDialogTitle) {
                    rcmDialogTitle = attrs.rcmDialogTitle;
                }

                // URL of content to load
                var rcmDialogLink = null;
                if (attrs.rcmDialogLink) {
                    rcmDialogLink = attrs.rcmDialogLink;
                }

                var rcmDialogStrategy = 'rcmStandardDialog';
                if (attrs.rcmDialogStrategy) {
                    rcmDialogStrategy = attrs.rcmDialogStrategy;
                }

                var rcmDialogActions = null;

                if (attrs.rcmDialogActions) {
                    try {
                        rcmDialogActions = scope.$eval(attrs.rcmDialogActions);

                    } catch (e) {
                        $log.warn('rcmDialogActions for dialog ' + rcmDialogId + ' format is invalid and was ignored.');
                    }
                }

                var dialog = RcmDialog.buildDialog(
                    rcmDialogId,
                    rcmDialogTitle,
                    rcmDialogLink,
                    rcmDialogStrategy,
                    rcmDialogActions,
                    scope
                );

                jQuery(elm).click(
                    function () {
                        dialog.open();
                    }
                )
            };

            return {
                restrict: 'A',
                link: thisLink
            }

        }
    ]
);
