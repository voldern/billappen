window.$t = function(key, values) {
    let translationValue = window.jsMessages[key] || key;

    if (window.LGD && window.LGD.debug && !window.jsMessages[key]) {
        console.warn('Missing translation for key: ' + key);
        translationValue = '__' + key;
    }

    if (typeof values !== "object") {
        return translationValue;
    }

    if (Array.isArray(values)) {
        values.forEach(function (value, index) {
            translationValue = translationValue.replace(`{${index}}`, value);
        });
    } else {
        Object.keys(values).forEach(function (placeholder) {
            translationValue = translationValue.replaceAll(`{${placeholder}}`, values[placeholder]);
        });

        // plural must be boolean
        if (values['plural'] !== undefined) {
            let translationSplit = translationValue.split('|');
            if (values['plural'] === true && translationSplit[1]) {
                return translationSplit[1];
            }

            return translationSplit[0];
        }
    }

    return translationValue;
}

var APP = APP || {};

APP.store = {}; // Temp storage.
APP.transaction = {}; // Transaction object
APP.transaction.giftcardPurchase = false;

APP.core = (function () {
    "use strict";

	var $language_uri = "";

    return {

		setLanguageUri: function (str) {
			if (str === "/en") {
				$language_uri = str;
			}
		},

		getLanguageUri: function () {
			return $language_uri;
		},

        isMobile: function () {
            APP.store.mobile = (/(iphone|ipod|ipad|android)/).test(navigator.userAgent.toLowerCase());
            return APP.store.mobile;
        },


        /** Returns a DOM element.
         * @param obj containing the markup.
         * Example:
         *  {
            name: 'div',
            attributes: {style: 'text-align:center;'},
            text: 'Betaling utføres, vennligst vent.',
            children: [
                {
                    name: 'div',
                    attributes: {'class': 'progress progress-striped active'},
                    children: [
                        {
                            name: 'div',
                            attributes: {'class': 'bar', style: 'width:' + APP.store.billingLoaderWidth + '%;'}
                        }
                    ]
                }
            ]
            }
         */
        createElement: function (obj) {

            var that        = this,
                element     = document.createElement(obj.name),
                attributes  = obj.attributes,
                children    = obj.children;


            if (attributes !== undefined) {
                var prop_arr = ['checked', 'disabled', 'selected']; // needs to be set with prop() jquery > 1.9

                $.each(attributes, function (key, val) {
                    if ($.inArray(key, prop_arr) !== -1) {
                        $(element).prop(key, true);
                    } else {
                        $(element).attr(key, val);
                    }
                });
            }

            if (obj.text !== undefined) {
                $(element).html(obj.text);
            }

            if (children !== undefined) {

                $.each(children, function (key) {
                    var child = that.createElement(children[key]);

                    if (child !== undefined) {
                        $(element).append(child);
                    }
                });
            }

            return element;
        },


        /** INSERTS HTML
         * @param data object
         * Object properties: name, message and severity.
         * Severity should be the class you want to apply to the alert (applies colors). e.g 'alert-danger', 'alert-warning', 'alert-success'.
         */
        insertHtml: function (data) {
            if (data.message !== undefined) {
                $(data.name).hide()
                            .html( (data.severity ? '<div class="alert ' + data.severity + '">': '')  + data.message + (data.severity ? '</div>' : '') )
                            .fadeIn(200);
            }
        },


        // Overrides bootstrap modal plugin. Enables/disables closing of modal.
        modalCloseControl: function (obj) {
            if (obj.id !== undefined && $(obj.id).length > 0) {
                const bsModalInstance = bootstrap.Modal.getInstance(document.querySelector(obj.id));
                if (!bsModalInstance) {
                    return;
                }

                bsModalInstance._isShown = obj.enable === true;
            }
        },


        munchCrumb: function (crumb) {
            if (crumb) {
                setTimeout(function() {
                    $.ajax({
                        type: "POST",
                        url:  "/aiko/findCrumb",
                        data: {
                            crumb: crumb,
                            adblock: typeof window.gaGlobal === "undefined"
                        },
                        dataType: "json"
                    });
                }, this.isMobileOrTablet() ? 1000 : 500);
            }
        },

        isMobileOrTablet: function() {
            return (navigator.userAgent.match(/Android/i)
                || navigator.userAgent.match(/iPhone/i)
                || navigator.userAgent.match(/iPad/i)
                || navigator.userAgent.match(/iPod/i)
            )
        },

        animatedScroll: function($el) {
            var destination = 'body',
                target = $el.data('target'),
                href = $el.attr('href'),
                offset = ($el.data('offset') ? parseInt($el.data('offset'), 10) : 0);

            if (target && $(target).length > 0) {
                destination = target;
            } else if (href && href.length > 1 && $(href).length > 0) {
                destination = href;
            }

            $("html, body").animate({
                scrollTop: $(destination).position().top + offset
            }, 300);
        },

        reportImages: function (img, location) {
            if (navigator.userAgent.match(/Google-Read-Aloud/)) {
                return;
            }

            $.ajax( {
                url: '/raw/missing_image',
                type: 'post',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    'image': img.target.src,
                    'type': img.type,
                    'naturalWidth': img.target.naturalWidth,
                    'location': location
                })
            });
        },


        stickyHeader: function(element) {
            var getCurrentScroll = function() {
                return window.pageYOffset || document.documentElement.scrollTop;
            }

            var prevScrollpos = getCurrentScroll();
            var ticking = false;

            var navbar = document.getElementById(element);

            window.addEventListener('scroll', function() {
                var currentScrollPos = getCurrentScroll();

                if (!ticking) {
                    window.requestAnimationFrame(function() {

                        if (currentScrollPos > 50) {
                            navbar.classList.add('unpinned');
                            navbar.classList.remove('pinned');
                        }

                        if (prevScrollpos > currentScrollPos) {
                            navbar.classList.add('pinned');
                            navbar.classList.remove('unpinned');
                        }

                        if (currentScrollPos > 40) {
                            navbar.classList.add('not-top');
                        } else {
                            navbar.classList.remove('not-top');
                        }

                        if (currentScrollPos < 10) {
                            navbar.classList.remove('pinned', 'unpinned');
                        }

                        prevScrollpos = currentScrollPos;
                        ticking = false;
                    });

                    ticking = true;
                }
            });

        }
    };

})();

APP.modal = (function() {

    let modalElement;

    const dialogId = 'dialog';
    const _dialog = {
        createModal: function() {
            const modalHTML = `
                <div class="modal fade" id="dialog" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content"></div>
                    </div>
                </div>
            `;

            const template = document.createElement('template');
            template.innerHTML = modalHTML.trim();
            modalElement = template.content.firstChild;
        },

        addClasses: function (classes, selector) {
            const classArray = (typeof classes === 'string') ? [classes] : classes;
            const validClasses = classArray.filter(function(className) {
                return typeof className === 'string' && className.trim() !== '';
            });

            if (validClasses.length === 0) {
                return;
            }

            // get the element to add classes to
            const element = selector ?
                modalElement.querySelector(selector) :
                modalElement;

            if (element) {
                validClasses.forEach(function(className) {
                    element.classList.add(className.trim());
                });
            }
        },

        addData: function (data, selector) {
            const element = selector ?
                modalElement.querySelector(selector) :
                modalElement;

            if (element) {
                Object.entries(data).forEach(([key, value]) => {
                    element.dataset[key] = value;
                });
            }
        },

        setModal: function(modal) {
            if (modal) {
                if (modal.classes && modal.classes.length > 0) {
                    this.addClasses(modal.classes);
                }
                if (modal.data) {
                    this.addData(modal.data);
                }
            }
        },

        setModalDialog: function(modalDialog) {
            if (modalDialog && modalDialog.classes && modalDialog.classes.length > 0) {
                this.addClasses(modalDialog.classes, '.modal-dialog');
            }
        },

        setHeader: function (modalHeader) {
            const headerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title">${modalHeader.content}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${$t('Lukk')}"></button>
                </div>
            `;

            modalElement.querySelector('.modal-content')
                .insertAdjacentHTML('beforeend', headerHTML);

            if (modalHeader.classes && modalHeader.classes.length > 0) {
                this.addClasses(modalHeader.classes, '.modal-header');
            }

            if (modalHeader.close_class && modalHeader.close_class.length > 0) {
                this.addClasses(modalHeader.close_class, '.modal-header .btn-close');
            }
        },

        setBody: function (modalBody) {
            const bodyHTML = `
                <div class="modal-body">${modalBody.content}</div>
            `;

            modalElement.querySelector('.modal-content')
                .insertAdjacentHTML('beforeend', bodyHTML);

            if (modalBody.classes && modalBody.classes.length > 0) {
                this.addClasses(modalBody.classes, '.modal-body');
            }

            if (modalBody.data) {
                this.addData(modalBody.data, '.modal-body');
            }
        },

        setFooter: function (modalFooter) {
            if (!modalFooter) {
                return
            }

            let footerContent = '';
            if (Array.isArray(modalFooter.content)) {
                footerContent = modalFooter.content.join('');
            } else {
                footerContent = modalFooter.content;
            }

            const footerHTML = `
                <div class="modal-footer gap-2">${footerContent}</div>
            `;

            modalElement.querySelector('.modal-content')
                .insertAdjacentHTML('beforeend', footerHTML);
        },


        // add modal to DOM and render it
        render: function (modal, settings) {
            document.body.appendChild(modal);
            return new bootstrap.Modal(modal, settings);
        }
    };

    const _hideActiveModal = function () {
        const activeModal = document.getElementById(dialogId);
        if (activeModal) {
            const bsModalInstance = bootstrap.Modal.getInstance(activeModal);
            if (bsModalInstance) {
                bsModalInstance.hide();
            }
        }
    }

    const _isModalActive = function (selector) {
        const activeModal = document.querySelector(selector);
        if (activeModal) {
            const bsModalInstance = bootstrap.Modal.getInstance(activeModal);
            if (bsModalInstance) {
                return true;
            }
        }
        return false;
    }

    return {

        render: _dialog.render,

        show: function(values, settings) {
            _dialog.createModal();

            // non-content
            _dialog.setModal(values.modal);
            _dialog.setModalDialog(values.modalDialog);

            // content
            _dialog.setHeader(values.modalHeader);
            _dialog.setBody(values.modalBody);
            _dialog.setFooter(values.modalFooter);

            // append to body and render
            const bsModal = _dialog.render(modalElement, settings);
            bsModal.show();
        },

        showSimpleAlert: function(title, message, redirectUriOnClose, singleModalInstanceSelector) {
            const classes = [ 'modal-alert' ];
            if (singleModalInstanceSelector) {
                if (_isModalActive(singleModalInstanceSelector)) {
                    return;
                }

                classes.push(singleModalInstanceSelector.replace('.', ''));

            }

            APP.modal.show({
                modal: {
                    classes: classes
                },
                modalHeader: {
                    content: '<svg class="icon icon-alert-triangle-big"><use xlink:href="' + window.LGD.svgSpriteUrl + '#alert-triangle-big"></use></svg>' + title
                },
                modalBody: {
                    content: message
                },
                modalFooter: {
                    content: [
                        '<a href="#" class="btn btn-primary" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    ]
                }
            });

            if (redirectUriOnClose) {
                const dialog = document.getElementById(dialogId);

                if (dialog) {
                    dialog.addEventListener('hidden.bs.modal', function(){
                        if (typeof redirectUriOnClose === "function") {
                            redirectUriOnClose()
                        } else {
                            APP.utils.redirect(redirectUriOnClose);
                        }
                    }, {
                        once: true
                    });
                }
            }
        },

        showServiceMessageModal: function () {
            _hideActiveModal();

            APP.modal.show({
                modalHeader: {
                    content: '<svg class="icon icon-alert-triangle-big"><use xlink:href="' + window.LGD.svgSpriteUrl + '#alert-triangle-big"></use></svg>' + $t('Driftsmelding')
                },
                modalBody: {
                    content: $('.service-message .service-message-item').html()
                },
                modalFooter: {
                    content: [
                        '<a href="#" class="btn btn-primary" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    ]
                }
            })
        },

        showAccessRequiredModal: function(callback) {
            _hideActiveModal();

            APP.modal.show({
                modalHeader: {
                    content: '<svg class="icon icon-alert-triangle-big"><use xlink:href="' + window.LGD.svgSpriteUrl + '#alert-triangle-big"></use></svg>' + $t('Ingen tilgang')
                },
                modalBody: {
                    content: $t('Du må kjøpe tilgang for å kunne benytte deg av denne tjenesten.')
                },
                modalFooter: {
                    content: [
                        '<a href="' + APP.core.getLanguageUri() + '/oversikt/klasse/" class="btn btn-primary">' + $t('Kjøp tilgang nå') + '</a>',
                        '<a href="#" class="btn btn-default" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    ]
                }
            })

            if (typeof callback === "function") {
                const dialog = document.getElementById(dialogId);

                if (dialog) {
                    dialog.addEventListener('hidden.bs.modal', function(){
                        callback();
                    }, {
                        once: true
                    });
                }
            }
        },

        showBySelector: function(selector) {
            try {
                const bsModal = new bootstrap.Modal(selector, {
                    keyboard: false
                })
                bsModal.show();
            } catch (error) {
                console.warn(`Modal does not exist (${selector})`);
            }
        },

        isShown: function (selector) {
            const bsModalInstance = bootstrap.Modal.getInstance(document.querySelector(selector));
            if (bsModalInstance) {
                return bsModalInstance._isShown;
            }

            return false;
        }
    };

})();


APP.token = (function () {

    return {

        fetchLanguageModal: function (btn, classIds, source, forcedLanguageUri) {
            APP.utils.loadingButton(btn, true);

            $.ajax({
                url:      (forcedLanguageUri ? forcedLanguageUri : APP.core.getLanguageUri()) + '/ajax/fetchLanguageModal',
                type:     'get',
                dataType: 'html',
                data:     {
                    classIds: classIds.join(','),
                    source: source
                }
            }).done(function (response) {
                APP.modal.show({
                    modalHeader: {
                        content: '<svg class="icon icon-globe text-success"><use xlink:href="' + window.LGD.svgSpriteUrl + '#globe"></use></svg>' + $t('Endre språk')
                    },
                    modalBody:   {
                        content: response
                    },
                    modalFooter: {
                        content: '<a href="#" class="btn btn-blue-gray" data-bs-dismiss="modal">' + $t('Avbryt') + '</a>'
                    }
                })

            }).fail(function (response) {
                if (response.status === 401) {
                    APP.utils.redirect('/');
                } else {
                    APP.modal.showSimpleAlert($t('En feil oppsto'), response.responseText, window.location.href)
                }

            }).always(function () {
                APP.utils.loadingButton(btn, false);
            })
        },

        changeTokenLanguage: function (btn, obj) {
            APP.utils.loadingButton(btn, true);

            $.ajax({
                url: '/ajax/changeTokenLanguage',
                type: 'post',
                dataType: 'json',
                data: obj
            }).done(function (response) {
                window.location.href = response.dashboard_path ? response.dashboard_path : '/oversikt';
            }).fail(function () {
                APP.utils.loadingButton(btn, false);
                window.location.href = APP.core.getLanguageUri() + '/oversikt';
            })
        }
    }
})();


$(function(){
    "use strict";

    // Force DOM removal of modal on hidden.
    $(document).on('hidden.bs.modal', '#dialog', function (e) {
        if ($(this).data('persist') !== true) {
            $(this).remove();
        }
    });

    $(document).on('click', '.scroll-to', function(e) {
        e.preventDefault();
        APP.core.animatedScroll($(this));
    });

    $(document).on('click', 'a.oneclick', function(e) {
        if ($(this).hasClass('already-clicked') === false) {
            $(this).addClass('already-clicked');
        } else {
            e.preventDefault();
        }
    });

    $(document).on('click', '.access-required-modal', function(e) {
        e.preventDefault();
        APP.modal.showAccessRequiredModal();
    })

    // Shouldn't be used on forms that already have a submit handler!
    $(document).on('submit', 'form.oneclick-submit', function() {
        $(this).find('input[type="submit"]').prop('disabled', true);
    });

    $('img').on('error', function(el) {
        if (el.target && el.target.src && el.target.complete) {

            if (el.target.src.indexOf('https://cdn.') > -1) {
                APP.core.reportImages(el, window.location.pathname);
            }
        }
    });
});

// Ajax hook for refreshing page if response contains reload parameter set to true
$(document).ajaxSuccess(function (event, xhr) {
    if (xhr.getResponseHeader('Content-Type') === 'application/json') {
        if (xhr.status === 401) {
            APP.modal.showSimpleAlert($t('Du har blitt logget ut'), $t('Du må logge inn for å fortsette.'), '/login');
        }
        if (JSON !== undefined) {
            var resp = JSON.parse(xhr.responseText);
            if (resp.reload && resp.reload === true) {
                window.location.reload();
            }
        }
    }
});

// https://github.com/twbs/bootstrap/issues/41005
window.addEventListener('hide.bs.modal', () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
});
