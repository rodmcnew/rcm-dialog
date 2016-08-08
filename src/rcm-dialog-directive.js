/**
 * RcmDialog.rcmDialog
 */
angular.module('RcmDialog').directive(
    'rcmDialog',
    [
        '$compile',
        function ($compile) {

            var rcmDialogElm = null;

            var modalTemplate = '<div class="modal fade"' +
                ' id="TEMP"' +
                    //'tabindex="-1"' + // This causes issues
                ' role="dialog"' +
                ' aria-labelledby="rcmDialogLabel"' +
                ' aria-hidden="true"></div>';

            var updateElm = function (dialog) {

                var id = null;
                var newModal = null;
                var newDirectiveStrat = null;

                id = dialog.strategyName + ':' + dialog.id; //.replace(/(:|\.|\[|\])/g, "\\$1")

                if (!dialog.elm) {

                    newModal = jQuery(modalTemplate);
                    newModal.attr('id', id);
                    newDirectiveStrat = jQuery('<div ' + dialog.getDirectiveName() + '="' + dialog.id + '"></div>');
                    newModal.append(newDirectiveStrat);

                    newModal.modal(
                        {
                            show: false
                        }
                    );

                    dialog.setElm(newModal);

                    newModal.on(
                        'show.bs.modal',
                        function (event) {
                            dialog.openState = 'opening';
                            $compile(dialog.elm.contents())(dialog.elm.scope());
                        }
                    );

                    rcmDialogElm.append(newModal);
                }
            };

            RcmDialog.eventManager.on(
                'dialog.open',
                'rcmDialog',
                function (dialog) {
                    updateElm(dialog);
                }
            );

            var thisCompile = function (tElement, tAttrs) {

                return function (scope, elm, attrs, ctrl) {

                    rcmDialogElm = elm;
                };
            };

            return {
                restrict: 'A',
                compile: thisCompile
            }
        }
    ]
);
