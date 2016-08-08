/**
 * RcmDialog
 */
angular.module(
    'RcmDialog',
    []
)
    .factory(
    'rcmDialogService',
    [
        '$compile',
        function ($compile) {

            return RcmDialog;
        }
    ]
);

/**
 * Compile Elm if dynamically created
 */
angular.element(document).ready(
    function () {
        RcmDialog.buildDialogElement();
    }
);

if (typeof rcm !== 'undefined') {
    rcm.addAngularModule('RcmDialog');
}
