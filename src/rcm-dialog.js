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
     * buildId
     * @param id
     * @param url
     * @returns {*}
     */
    buildId: function (id, url) {

        if (!id) {
            id = url;
        }
        return id;
    },

    /**
     * buildDialog
     * @param id
     * @param title
     * @param url
     * @param strategyName
     * @param actions
     * @param contentscope
     * @returns {*}
     */
    buildDialog: function (id, title, url, strategyName, actions, contentscope) {

        id = RcmDialog.buildId(id, url);

        if (RcmDialog.hasDialog(id)) {
            RcmDialog.removeDialog(id);
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
        if(RcmDialog.dialogs[dialogId].elm){
            RcmDialog.dialogs[dialogId].elm.remove();
        }
        //RcmDialog.dialogs[dialogId].elm.destroy();
        //RcmDialog.dialogs[dialogId].scope.$destroy();
        RcmDialog.dialogs[dialogId] = undefined;
        delete RcmDialog.dialogs[dialogId];
    }
};
