/**
 * RcmDialog
 *  requires:
 *   - rcmGuid
 *   - Bootstrap v3.3.2 (http://getbootstrap.com) bootstrap.js
 */
var RcmDialog = {

    service: null,

    defaultStrategy: 'rcmBlankDialog',

    /**
     * dialogs
     */
    dialogs: {},

    /**
     * eventManager
     */
    eventManager: {

        events: {},

        on: function (event, id, method) {

            if (!this.events[event]) {
                this.events[event] = {};
            }

            this.events[event][id] = method;
        },

        trigger: function (event, args) {

            if (this.events[event]) {
                jQuery.each(
                    this.events[event],
                    function (index, value) {
                        value(args);
                    }
                );
            }
        }
    },

    /**
     * buildDialogElement - make sure there is an element for dialog
     */
    buildDialogElement: function () {

        // Check by attribute
        var dialogElm = jQuery('body').find('[data-rcm-dialog]');

        if (dialogElm.length) {
            return;
        }

        // Check by element tag
        dialogElm = jQuery('body').find('data-rcm-dialog');

        if (dialogElm.length) {
            return;
        }

        dialogElm = jQuery('<div data-rcm-dialog="true"></div>');
        jQuery('body').prepend(dialogElm);

        // Compile cant be done if injector not defined
        if (!angular.element(dialogElm).injector()) {
            console.warn('RcmDialog cannot compile data-rcm-dialog element dynmically, angular injector is undefined.');
            return
        }

        angular.element(dialogElm).injector().invoke(
            function ($compile) {
                var scope = angular.element(dialogElm).scope();
                $compile(dialogElm)(scope);
            }
        );
    },

    /**
     * buildDialog
     */
    buildDialog: function (id, title, url, strategyName, actions, contentscope) {

        if (!id) {
            id = url;
        }

        if (RcmDialog.hasDialog(id)) {
            return RcmDialog.getDialog(id);
        }

        var dialog = new RcmDialog.dialog();

        if (strategyName) {
            dialog.strategyName = strategyName;
        } else {
            dialog.strategyName = new RcmDialog.defaultStrategy;
        }

        dialog.loading = true;

        dialog.id = id;
        dialog.title = title;
        dialog.url = url;

        if (actions) {
            angular.forEach(
                actions,
                function (value, key) {
                    dialog.setAction(key, value);
                }
            );
        }

        if (contentscope) {
            dialog.contentscope = contentscope;
        }

        RcmDialog.addDialog(dialog);

        return dialog;
    },

    /**
     * action class
     */
    action: function () {

        var self = this;

        self.type = 'button'; // disabled, button, hide
        self.label = 'button';
        self.css = 'btn btn-default';
        self.method = function (dialog) {
        }
    },

    /**
     * dialog
     */
    dialog: function () {

        var self = this;
        self.id = 0;
        self.loading = true;
        self.strategyName = null;
        self.title = '';
        self.url = '';
        self.elm = null;
        self.openState = 'init';
        self.preOpened = false;
        self.contentscope = {};

        self.actions = {
            close: {
                type: 'button',
                label: 'Close',
                css: 'btn btn-default',
                method: function (dialog) {
                    self.close();
                }
            }
        };

        /**
         * setElm
         * @param elm
         */
        self.setElm = function (elm) {

            self.elm = elm;
            self.syncEvents();

            // If open was called before the elm is set, then we should open now
            if (self.preOpened) {
                self.open();
            }
        };

        /**
         * getDirectiveName
         * @returns {string}
         */
        self.getDirectiveName = function () {

            return self.strategyName.replace(
                /([a-z])([A-Z])/g,
                '$1-$2'
            ).toLowerCase();
        };

        /**
         * setAction
         * @param actionName
         * @param action
         */
        self.setAction = function (actionName, action) {

            if (self.actions[actionName]) {
                self.actions[actionName] = angular.extend(
                    self.actions[actionName],
                    action
                );
            } else {
                self.actions[actionName] = action;
            }

            RcmDialog.eventManager.trigger(
                'dialog.setAction',
                self
            );
        };

        /**
         * getAction
         * @param actionName
         * @returns {*}
         */
        self.getAction = function (actionName) {
            if (self.actions[actionName]) {
                return self.actions[actionName];
            }

            return null;
        };

        /**
         * open
         */
        self.open = function () {

            RcmDialog.eventManager.trigger(
                'dialog.open',
                self
            );

            // Set flag if elm is not ready
            if (!self.elm) {
                self.preOpened = true;
            }

            if (self.elm && self.openState !== 'open') {

                self.openState = 'open';
                self.loading = true;

                self.elm.modal('show');
            }
        };

        /**
         * If special action is used for close, we should use it
         */
        self.closeAction = function () {

            if (self.actions.close) {
                RcmDialog.eventManager.trigger(
                    'dialog.close',
                    self
                );
                if (self.elm && self.openState !== 'closed') {
                    self.actions.close.method(self);
                }
            }
        };

        /**
         * close
         */
        self.close = function () {

            RcmDialog.eventManager.trigger(
                'dialog.close',
                self
            );

            // Spam protection
            if (self.elm && self.openState !== 'closed') {
                self.openState = 'close';
                self.elm.modal('hide');
            }
        };

        /**
         * remove
         */
        self.remove = function () {
            RcmDialog.removeDialog(self.id)
        };

        /**
         * syncEvents
         */
        self.syncEvents = function () {

            if (self.elm.modal) {

                self.elm.on(
                    'show.bs.modal',
                    function (event) {
                        self.openState = 'opening';
                    }
                );

                self.elm.on(
                    'shown.bs.modal',
                    function (event) {
                        self.openState = 'opened';
                    }
                );

                self.elm.on(
                    'hide.bs.modal',
                    function (event) {
                        self.openState = 'closing';
                    }
                );

                self.elm.on(
                    'hidden.bs.modal',
                    function (event) {
                        self.openState = 'closed';
                        // The close action happens after closing
                        self.closeAction();
                        self.remove();
                    }
                );
            }
        }
    },

    /**
     * addDialog
     * @param dialog
     */
    addDialog: function (dialog) {
        RcmDialog.dialogs[dialog.id] = dialog;
    },

    /**
     * getDialog
     * @param dialogId
     * @returns {*}
     */
    getDialog: function (dialogId) {
        return RcmDialog.dialogs[dialogId];
    },

    /**
     * hasDialog
     * @param dialogId
     * @returns bool
     */
    hasDialog: function (dialogId) {
        return (RcmDialog.dialogs[dialogId])
    },

    /**
     * removeDialog
     * @param dialogId
     */
    removeDialog: function (dialogId) {
        RcmDialog.dialogs[dialogId].elm.remove();
        //RcmDialog.dialogs[dialogId].elm.destroy();
        //RcmDialog.dialogs[dialogId].scope.$destroy();
        RcmDialog.dialogs[dialogId] = undefined;
        delete RcmDialog.dialogs[dialogId];
    }
};

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

/**
 * Get Module
 */
angular.module(
    'RcmDialog'
)

/**
 * RcmDialog.rcmBlankDialog
 */
    .directive(
    'rcmBlankDialog',
    [
        '$compile',
        '$templateCache',
        function ($compile, $templateCache) {

            var thisCompile = function (tElement, tAttrs, transclude) {

                var thisLink = function (scope, elm, attrs, ctrl) {

                    var dialogId = attrs.rcmBlankDialog;

                    scope.dialog = RcmDialog.getDialog(dialogId);

                    // Bring in contentscope scope vars
                    scope.contentscope = scope.dialog.contentscope;

                    $templateCache.remove(scope.dialog.url);

                    scope.loading = scope.dialog.loading = false;

                    scope.$apply();
                };

                return thisLink;
            };

            return {
                restrict: 'A',
                compile: thisCompile,
                scope: [],
                template: '<div ng-include="dialog.url"><!--{{dialog.url}}--></div>'
            }
        }
    ]
);
/**
 * Get Module
 */
angular.module(
    'RcmDialog'
)

/**
 * RcmDialog.rcmBlankIframeDialog
 */
    .directive(
    'rcmBlankIframeDialog',
    [
        '$compile',
        '$parse',
        function ($compile, $parse) {

            var thisCompile = function (tElement, tAttrs, transclude) {

                var thisLink = function (scope, elm, attrs, ctrl) {

                    var dialogId = attrs.rcmBlankIframeDialog;

                    scope.dialog = RcmDialog.getDialog(dialogId);
                    // contentscope will not work in this case

                    scope.dialog.loading = false;
                    scope.$apply();
                };

                return thisLink;
            };

            return {
                restrict: 'A',
                compile: thisCompile,
                scope: [],
                template: '' +
                '<div id="RcmStandardDialogTemplateIn" style="display: block;" ng-hide="dialog.loading">' +
                '<div class="modal-dialog">' +
                '    <div class="modal-content">' +
                '        <div class="modal-header">' +
                '            <button ng-show="dialog.actions.close.type == \'button\'" type="button" class="close" aria-hidden="true" data-ng-click="dialog.actions.close.method(dialog)">&times;</button>' +
                '            <h1 class="modal-title" id="myModalLabel">{{dialog.title}}</h1>' +
                '        </div>' +
                '        <div class="modal-body" style="height: 400px">' +
                '            <iframe src="{{dialog.url}}" style="width: 100%; height: 380px" frameborder="0"></iframe>' +
                '        </div>' +
                '        <div class="modal-footer">' +
                '            <button ng-repeat="(key, action) in dialog.actions" ng-show="action.type == \'button\'" type="button" class="{{action.css}}" data-ng-click="action.method(dialog)" >' +
                '                {{action.label}}' +
                '            </button>' +
                '        </div>' +
                '    </div>' +
                '</div>' +
                '</div>'

            }
        }
    ]
);
/**
 * Get Module
 */
angular.module(
    'RcmDialog'
)

/**
 * RcmDialog.rcmFormDialog
 */
    .directive(
    'rcmFormDialog',
    [
        '$compile',
        '$http',
        function ($compile, $http) {

            var thisCompile = function (tElement, tAttrs, transclude) {

                var thisLink = function (scope, elm, attrs, ctrl) {

                    var dialogId = attrs.rcmFormDialog;

                    scope.dialog = RcmDialog.getDialog(dialogId);

                    // Bring in contentscope scope vars
                    scope.contentscope = scope.dialog.contentscope;

                    var existingAction = scope.dialog.getAction('save');

                    var formAction = new RcmDialog.action();

                    formAction.type = 'button';
                    formAction.label = 'Save';
                    formAction.css = 'btn btn-primary';
                    formAction.method = function (dialog) {

                        scope.dialog.loading = true;
                        // @todo may need scope.$apply()
                        var content = elm.find(".modal-body");
                        var form = elm.find('form');
                        var actionUrl = form.attr('action');

                        jQuery.post(actionUrl, form.serialize())
                            .done(
                            function (data) {
                                formAction.type = 'hide';
                                scope.dialog.loading = false;
                                scope.$apply();
                            }
                        )
                            .fail(
                            function () {
                                scope.dialog.loading = false;
                                scope.$apply();
                            }
                        )
                            .always(
                            function (data) {

                                content.html(data);
                                scope.dialog.loading = false;
                                $compile(content)(scope);
                                scope.$apply();
                            }
                        );
                    };

                    if(existingAction) {
                        formAction = angular.extend(formAction, existingAction);
                    }

                    scope.dialog.setAction(
                        'save',
                        formAction
                    );

                    $http({method: 'GET', url: scope.dialog.url}).
                        success(
                        function (data, status, headers, config) {

                            var contentBody = elm.find(".modal-body");
                            contentBody.html(data);
                            scope.dialog.loading = false;
                            $compile(contentBody)(scope);
                            // @todo may need scope.$apply()
                        }
                    ).
                        error(
                        function (data, status, headers, config) {

                            scope.dialog.loading = false;
                            // @todo may need scope.$apply()
                        }
                    );

                    scope.$apply();
                };

                return thisLink;
            };

            return {
                restrict: 'A',
                compile: thisCompile,
                scope: [],
                template: '' +
                '<div id="RcmFormDialogIn" style="display: block;" ng-hide="dialog.loading">' +
                ' <div class="modal-dialog">' +
                '  <div class="modal-content">' +
                '   <div class="modal-header">' +
                '    <button ng-show="dialog.actions.close.type == \'button\'" type="button" class="close" aria-hidden="true" data-ng-click="dialog.actions.close.method(dialog)">&times;</button>' +
                '    <h1 class="modal-title" id="myModalLabel">{{dialog.title}}</h1>' +
                '   </div>' +
                '   <div class="modal-body"><!-- CONTENT LOADED HERE --></div>' +
                '   <div class="modal-footer">' +
                '    <button ng-repeat="(key, action) in dialog.actions" ng-show="action.type == \'button\'" type="button" class="{{action.css}}" data-ng-click="action.method(dialog)" >' +
                '        {{action.label}}' +
                '    </button>' +
                '   </div>' +
                '  </div>' +
                ' </div>' +
                '</div>'
            }
        }
    ]
);
/**
 * Get Module
 */
angular.module(
    'RcmDialog'
)

/**
 * RcmDialog.rcmStandardDialog
 */
    .directive(
    'rcmStandardDialog',
    [
        '$compile',
        '$timeout',
        '$http',
        function ($compile, $timeout, $http) {


            var thisCompile = function (tElement, tAttrs, transclude) {

                var thisLink = function (scope, elm, attrs, ctrl) {

                    var dialogId = attrs.rcmStandardDialog;

                    scope.safeApply = function(fn) {
                        var phase = this.$root.$$phase;
                        if(phase == '$apply' || phase == '$digest') {
                            if(fn && (typeof(fn) === 'function')) {
                                fn();
                            }
                        } else {
                            this.$apply(fn);
                        }
                    };

                    scope.dialog = RcmDialog.getDialog(dialogId);

                    // Bring in contentscope scope vars
                    scope.contentscope = scope.dialog.contentscope;

                    $http({method: 'GET', url: scope.dialog.url}).
                        success(
                        function (data, status, headers, config) {
                            var contentBody = elm.find(".modal-body");
                            contentBody.html(data);
                            $compile(contentBody)(scope);
                        }
                    ).
                        error(
                        function (data, status, headers, config) {
                            var msg = "Sorry but there was an error: ";
                            scope.error(msg + status);
                        }
                    );

                    scope.dialog.loading = false;

                    scope.safeApply();
                };

                return thisLink;
            };

            return {
                restrict: 'A',
                compile: thisCompile,
                scope: [],
                template: '' +
                '<div id="RcmStandardDialogTemplateIn" style="display: block;" ng-hide="dialog.loading">' +
                ' <div class="modal-dialog">' +
                '  <div class="modal-content">' +
                '   <div class="modal-header">' +
                '    <button ng-show="dialog.actions.close.type == \'button\'" type="button" class="close" aria-hidden="true" data-ng-click="dialog.actions.close.method(dialog)">&times;</button>' +
                '    <h1 class="modal-title" id="myModalLabel">{{dialog.title}}</h1>' +
                '   </div>' +
                '   <div class="alert alert-warning" role="alert" ng-show="error">{{error}}</div>' +
                '   <div class="modal-body"><!-- CONTENT LOADED HERE --></div>' +
                '   <div class="modal-footer">' +
                '    <button ng-repeat="(key, action) in dialog.actions" ng-show="action.type == \'button\'" type="button" class="{{action.css}}" data-ng-click="action.method(dialog)" >' +
                '        {{action.label}}' +
                '    </button>' +
                '   </div>' +
                '  </div>' +
                ' </div>' +
                '</div>'
            }
        }
    ]
);
