var APP = APP || {};
APP.bill = (function () {
    "use strict";

    return {

        step1: function () {
            this.requestPassword(APP.transaction.msisdn, function (response) {
                $(document).trigger('/passwordResponse', [response]);
            });
        },


        step2: function () {

            var _processValidation = function (response) {
                APP.transaction.user_id = parseInt(response.user_id, 10);
                $(document).trigger('/validationResponse', [response]);
            };

            APP.utils.ajaxCall({
                type: 'POST',
                url: '/payment/validate_user',
                data: APP.transaction,
                dataType: 'json'
            }, _processValidation, function (error) {
                if (error.responseJSON && error.responseJSON.error) {
                    $(document).trigger('/validationResponse', [{
                        status: error.responseJSON.error.code,
                        message: error.responseJSON.error.message,
                    }]);
                }
            });
        },

        step3: function () {

            if (APP.transaction.giftcardPurchase === true) {
                APP.bill.giftcardPurchase();

                return;
            }

            APP.utils.ajaxCall({
                type: 'POST',
                url: APP.transaction.inapp ? '/payment/web_payment' : '/payment/web_payment_front',
                data: APP.transaction,
                dataType: 'json'
            }, APP.bill.processPaymentResponse);
        },

        giftcardPurchase: function() {
            APP.utils.ajaxCall({
                type: 'POST',
                url: '/giftcard/payment',
                data: APP.transaction,
                dataType: 'json'
            }, APP.bill.processPaymentResponse);
        },

        // CHECK PAYMENT STATUS FOR SMS PURCHASE FRONT AND IN-APP.
        checkPaymentStatus: function () {

            if (!APP.transaction.paymentStatusCount) {
                APP.transaction.paymentStatusCount = 0;
            }

            var maxLoopCount = 39;
            if (APP.transaction.payment_type === 'SMS') {
                maxLoopCount = 10;
            }

            APP.transaction.paymentStatusCount++;
            if (APP.transaction.paymentStatusCount < maxLoopCount) {

                APP.utils.ajaxCall({
                    type: 'POST',
                    url: '/payment/check_payment_status',
                    data: {
                        user_id: (APP.transaction.user_id ? APP.transaction.user_id : ''),
                        smscode: APP.transaction.smscode,
                        token_id: (APP.transaction.token_id ? APP.transaction.token_id : '')
                    },
                    dataType: 'json'
                }, APP.bill.processPaymentResponse);

                return;
            }

            // Max loop count reached. Re-enable close on modal.
            APP.core.modalCloseControl({id: '#dialog', enable: true});
            APP.transaction.paymentStatusCount = 0;
            APP.transaction.billing_status = $t('Vi får for øyeblikket ikke kontakt med din teleoperatør.<br>Du kan starte prøven som normalt, status på bestillingen kan du se under Mine kjøp.');

            if (APP.transaction.inapp) {
                APP.bill.updateLoader({name: APP.store.current_step + ' .progress-bar', width: 100});
                APP.core.insertHtml({name: '.modal .modal-body .notice', message: APP.transaction.billing_status});

                if ($('.modal-footer').length > 0 && $('.modal-footer').hasClass('d-none')) {
                    $('.modal-footer').removeClass('d-none');
                }

                if (APP.modal.isShown('.modal')) {
                    $('.modal').on('hide.bs.modal', function () {
                        APP.utils.redirect('/oversikt/');
                    });
                }

            }
            // SMS is known to be slow with their DRM delivery,
            // allow users to login (status will be updated when DRM is received.
            else if (APP.transaction.payment_type === 'SMS') {
                APP.bill.autoLogin();
            }
        },

        triggerPaymentAlert: function (severity) {
            APP.core.insertHtml({
                name: APP.store.current_step + ' .notice',
                message: APP.transaction.billing_status,
                severity: severity
            });
        },

        processPaymentResponse: function (response) {

            APP.transaction.token_id = response.token_id;
            APP.transaction.token_class = (response.token_class !== undefined ? response.token_class : "notset");
            APP.transaction.description = (response.description !== undefined ? response.description : "notset");
            APP.transaction.payment_type = (response.payment_type !== undefined ? response.payment_type : "notset");
            APP.store.billingLoaderWidth += 10;
            APP.bill.updateLoader({
                name: APP.store.current_step + ' .progress-bar',
                width: APP.store.billingLoaderWidth
            });

            var i18nKey = 'vipps_checkpaymentstatus';
            if (APP.transaction.payment_type === 'SMS') {
                i18nKey = 'checkpaymentstatus';
            }

            switch (response.status) {

                case 'pending':
                    setTimeout(function () {
                        APP.bill.checkPaymentStatus();
                    }, 3000);

                    return;

                case 'redirect':
                    window.location = response.redirect_url;

                    return;

                case 'no_credit':
                case 'problem_FF_OVERCHARGE_LIMIT_EXCEEDED':
                case 'FF_OVERCHARGED_NOT_ALLOWED':
                case 'not_allowed':
                case 'problem_FF_POSTPAID_ONLY':
                case 'postpaid_only':
                case 'problem':
                case 'operator_blocked':
                case 'cancel':
                case 'timeout':
                case 'not_registered':
                case 'unsupported':
                case 'unmapped':
                case 'error':
                case 'reserve_failed':
                    APP.bill.updateLoader({name: APP.store.current_step + ' .progress-bar', width: 100});
                    APP.core.modalCloseControl({id: '#dialog', enable: true});

                    APP.transaction.billing_status = response.message;
                    APP.bill.triggerPaymentAlert('alert-danger');

                    break;

                case 'expired':
                    APP.bill.updateLoader({name: APP.store.current_step + ' .progress-bar', width: 100});
                    APP.core.modalCloseControl({id: '#dialog', enable: true});

                    APP.transaction.billing_status = response.message;
                    APP.bill.triggerPaymentAlert('alert-danger');

                    if (APP.modal.isShown('.modal')) {
                        $('.modal').on('hide.bs.modal', function () {
                            APP.utils.redirect(location.pathname);
                        });
                    }

                    break;

                case 'have_passes':
                    APP.bill.updateLoader({name: APP.store.current_step + ' .progress-bar', width: 100});

                    APP.core.modalCloseControl({id: '#dialog', enable: true});

                    APP.transaction.billing_status = response.message;

                    if (!APP.transaction.inapp) {
                        APP.bill.autoLogin();

                        return;
                    }

                    APP.bill.triggerPaymentAlert('alert-warning');

                    break;

                case 'TF_OK':
                case 'TT_OK':
                case 'delivered':
                case 'reserved':
                    APP.utils.pushGooglePurchase();

                    APP.bill.updateLoader({name: APP.store.current_step + ' .progress-bar', width: 100});
                    APP.core.modalCloseControl({id: '#dialog', enable: true});
                    APP.transaction.billing_status = response.message;

                    if (!APP.transaction.inapp) {
                        APP.bill.autoLogin();

                        return;
                    }

                    APP.bill.triggerPaymentAlert('alert-success');

                    if (APP.modal.isShown('.modal')) {
                        $('.modal').on('hide.bs.modal', function () {

                            // Android app billing via webview
                            if (typeof jb != 'undefined') {
                                jb.finish();

                                return;
                            }

                            // redirect to same page if URI contains oppgave.
                            if (location.pathname.indexOf("oppgave") !== -1) {
                                APP.utils.redirect(location.pathname);
                            } else {
                                APP.utils.redirect('/oversikt/');
                            }
                        });
                    }
                    break;
            }

            delete APP.transaction.vipps_token_id;
            delete APP.transaction.token_id;
            $('.btn-vipps, .purchase-card, .purchase-sms').prop({disabled: false});
            $('#dialog').find('.check-vipps-payment').addClass('d-none');

            if ($('.modal-footer').length > 0 && $('.modal-footer').hasClass('d-none')) {
                $('.modal-footer').removeClass('d-none');
            }
        },
        // Demo pass order
        stepDemo: function () {

            // Callback for use_demo
            var _processDemo = function (response) {

                $(document).trigger('/checkDemoStatus', [response]);

            };


            APP.utils.ajaxCall({
                type: 'POST',
                url: '/payment/use_demo',
                data: {
                    user_id: APP.transaction.user_id,
                    token_type_id: APP.transaction.token_type_id,
                    origin_id: APP.transaction.origin_id
                },
                dataType: 'json'
            }, _processDemo);

        },

        autoLogin: function () {

            // Android app billing via webview
            if (typeof jb != 'undefined') {
                jb.finish();

                return;
            }

            if (APP.transaction.user_id !== undefined && APP.transaction.smscode !== undefined) {

                // Callback for sms_auto_login.
                var _processAutoLogin = function (response) {
                    $(document).trigger('/autologin', [response]);
                };

                APP.utils.ajaxCall({
                    type: 'POST',
                    url: '/payment/sms_auto_login',
                    data: {
                        user_id: APP.transaction.user_id,
                        smscode: APP.transaction.smscode,
                        billing_status: APP.transaction.billing_status
                    },
                    dataType: 'json'
                }, _processAutoLogin);

            } else {
                APP.utils.ajaxLogger({
                    type: 'ajax',
                    message: '[ERROR] autoLogin: Missing values:[ user_id: ' + APP.transaction.user_id + ', smscode: ' + APP.transaction.smscode + ' ]'
                });
            }

        },


        // HIGHLIGHT NEXT STEP (FRONT PAYMENT)
        enableNextStep: function (holders) {
            $.each(holders, function (key, val) {
                if (key === "current") {

                    $(val).addClass('completed')
                        .removeClass('active error');

                    $(val).find('input[type=text], input[type=tel], button')
                        .prop('disabled', true);

                } else if (key === "next") {

                    $(val).addClass('active');

                    $(val).find(':disabled')
                        .prop('disabled', false);
                }
            });
        },

        requestPassword: function (username, callback) {
            if (username && callback) {
                APP.utils.ajaxCall({
                    type: 'POST',
                    url: '/login/request_password',
                    data: {
                        username: username
                    },
                    dataType: 'json'
                }, callback, function (error) {
                    if (error.responseJSON && error.responseJSON.error) {
                        callback({
                            status: 'error',
                            message: error.responseJSON.error.message
                        })
                    }
                });
            }
        },

        forgotPassword: function (username, callback) {
            if (username && callback) {
                APP.utils.ajaxCall({
                    type: 'POST',
                    url: '/login/request_password',
                    data: {
                        username: username,
                        forgot_pw: true
                    },
                    dataType: 'json'
                }, callback, function (error) {
                    if (error.responseJSON && error.responseJSON.error) {
                        callback({
                            status: 'error',
                            message: error.responseJSON.error.message,
                        });
                    }
                });
            }
        },


        billingLoader: function (data) {
            APP.store.billingLoaderWidth = 0;
            $(data.name).html(APP.core.createElement({
                name: 'div',
                attributes: {'class': 'billing-loader'},
                text: data.text || '',
                children: [
                    {
                        name: 'div',
                        attributes: {'class': 'progress'},
                        children: [
                            {
                                name: 'div',
                                attributes: {
                                    'class': 'progress-bar progress-bar-info progress-bar-striped active',
                                    style: 'width:' + APP.store.billingLoaderWidth + '%;'
                                }
                            }
                        ]
                    }
                ]
            }));
        },

        updateLoader: function (data) {

            if (APP.store.transition_support === undefined) {
                APP.store.transition_support = function supportsTransitions() {
                    var b = document.body || document.documentElement;
                    var s = b.style;
                    var p = 'transition';
                    if (typeof s[p] === 'string') {
                        return true;
                    }

                    var v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
                    p = p.charAt(0).toUpperCase() + p.substr(1);
                    for (var i = 0; i < v.length; i++) {
                        if (typeof s[v[i] + p] === 'string') {
                            return true;
                        }
                    }
                    return false;
                };
            }


            if (APP.store.transition_support) {
                $(data.name).animate({width: data.width + '%'});
            } else {
                $(data.name).animate({width: data.width + '%'}, 3000, 'linear');
            }
        }
    };
})();

$(function () {
    'use strict';

    $(document).on('click', '.plan .btn', function () {

        if (typeof gtag === 'undefined') {
            return;
        }

        var idArray = $(this).attr('id').split('_');
        var typeId = idArray[idArray.length - 1] || null;

        APP.ecommerce = $.grep(packages, function (element) {
            return element.id === typeId;
        })[0];

        if (APP.ecommerce === 'undefined') {
            return;
        }

        var currentItem = {
            "id": APP.ecommerce.id,
            "name": APP.ecommerce.name,
            "variant": APP.ecommerce.variant,
            "category": APP.ecommerce.category,
            "brand": APP.ecommerce.brand,
            "list_position": APP.ecommerce.list_position,
            "list_name": APP.ecommerce.list_name,
            "price": APP.ecommerce.price,
            "quantity": 1
        };

        gtag('event', 'select_content', {
            "content_type": "product",
            "items": [currentItem]
        });

        gtag('event', 'begin_checkout', {
            "items": [currentItem]
        });
    });
});

