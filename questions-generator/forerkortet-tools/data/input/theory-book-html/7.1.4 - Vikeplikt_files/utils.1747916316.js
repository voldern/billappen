var APP = APP || {};
// Utilities
APP.utils = (function () {
    "use strict";

    let popoverEventListenerAdded = false;

    return {

        checkNorwegianMsisdn: function (msisdn) {
            return msisdn.replace(/^[^49]|[^0-9]/g, '');
        },


        validateNorwegianMsisdn: function (msisdn) {
            msisdn = this.stripSpaces(msisdn);

            var regex = new RegExp('^([4]|[9])[0-9]{7}$');
            return regex.test(msisdn);
        },

        validateEmail: function (email) {
            var that        = this,
                validate    = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

            return validate.test(that.stripSpaces(email));
        },

        stripSpaces: function (str) {
            if (str && str.length > 2 && str.indexOf(' ') !== -1) {
                str = str.split(' ').join('');
            }
            return str;
        },
        pushGoogle: function (eventCategory, eventAction, eventLabel, nonInteraction) {
            nonInteraction = nonInteraction || false;
            if (typeof gtag !== 'undefined' && eventCategory && eventAction && eventLabel) {
                gtag('event', eventAction, {
                    'event_category' : eventCategory,
                    'event_label' : eventLabel,
                    'non_interaction': nonInteraction
                });
            }
        },
        pushGooglePurchase: function () {
            if (typeof gtag !== 'undefined' && typeof APP.ecommerce !== 'undefined') {
                gtag('event', 'purchase', {
                    "transaction_id": APP.transaction.token_id,
                    "affiliation": APP.ecommerce.brand,
                    "value": APP.transaction.total_price,
                    "currency": "NOK",
                    "items": [
                        {
                            "id": APP.ecommerce.id,
                            "name": APP.ecommerce.name,
                            "brand": APP.ecommerce.brand,
                            "category": APP.ecommerce.category,
                            "variant": APP.ecommerce.variant,
                            "list_position": APP.ecommerce.list_position,
                            "list_name": APP.ecommerce.list_name,
                            "quantity": 1,
                            "price": APP.ecommerce.price
                        }
                    ]
                });
            }

            if (typeof fbq !== 'undefined') {
                fbq('track', 'Purchase', {currency: 'NOK', value: 1});
            }
        },
        ajaxCall: function (prop, callback, failCallback) {
            if (typeof prop === 'object') {

				if (APP.core.getLanguageUri() !== "") {
					prop.url = APP.core.getLanguageUri() + prop.url;
				}

                $.ajax(prop).done(function(resp) {

                    if (callback !== undefined) {
                        if (resp !== undefined) {
                            callback(resp);
                        } else {
                            callback();
                        }
                    } else {
                        return resp;
                    }

                }).fail(function(resp) {
                    if (failCallback !== undefined) {
                        failCallback(resp);
                    }
                });
            } else {
                APP.utils.ajaxLogger({
                    type: 'ajax',
                    message: '[ERROR] ajaxCall: prop is not an object, type: ' + typeof(prop)
                });
            }
        },


        /** LOG MESSAGE TO SERVER.
         *
         * @param data [object]
         * data.type        [optional] logfile, default: ajax.
         * data.message     [required] message to be logged. Example: "[WARN] var g undefined, should be one of bla bla."
         */
        ajaxLogger: function (data) {

            if (!data.type) {
                data.type = 'ajax';
            }

            if (data.message) {

                $.ajax({
                    type: 'POST',
                    url: '/ajax/log',
                    data: {
                        type: data.type,
                        message: data.message
                    },
                    dataType: 'json'
                }).done(function() {

                });
            }
        },


        redirect: function (uri) {
            if (uri !== undefined) {
                if (uri !== location.pathname) {
                    if (APP.core.getLanguageUri() === '/en' && uri.indexOf('/en/') < 0) {
                        window.location = APP.core.getLanguageUri() + uri;
                    } else {
                        window.location = uri;
                    }
                } else {
                    window.location = uri;
                }
            }
        },


        // new loading indicator. TODO: probably need to add a site specific config file, so spinners and text can be changed.
        showLoading: function (obj) {
            if (!$.trim($(obj).find('.loading').html()).length) {
                $(obj).find('.loading').removeClass('hidden').append('<span class="loading-spinner"></span> Vennligst vent');
            } else {
                $(obj).find('.loading').removeClass('hidden').slideDown(100);
            }
        },


        // bootstrap 4 loading spinner
        loadingButton: function(button, disabled) {
            if (disabled !== undefined) {
                $(button).prop({disabled: disabled});
            }

            if ($(button).find('.spinner-border').length > 0) {
                $(button).find('.spinner-border').remove();

                return;
            }

            $(button).prepend('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span> ');
        },


        getCookie: function (check_name) {
            // first we'll split this cookie up into name/value pairs
            // note: document.cookie only returns name=value, not the other components
            var a_all_cookies   = document.cookie.split( ';' ),
                a_temp_cookie   = '',
                cookie_name     = '',
                cookie_value    = '',
                b_cookie_found  = false;

            for (var i = 0; i < a_all_cookies.length; i++ ) {
                // now we'll split apart each name=value pair
                a_temp_cookie = a_all_cookies[i].split( '=' );

                // and trim left/right whitespace while we're at it
                cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

                if ( cookie_name === check_name ) {
                    b_cookie_found = true;
                    if ( a_temp_cookie.length > 1 ) {
                        cookie_value = unescape( a_temp_cookie[1].replace(/^\s+|\s+$/g, '') );
                    }
                    // note that in cases where cookie is initialized but no value, null is returned
                    return cookie_value;
                }
                a_temp_cookie = null;
                cookie_name = '';
            }
            if (!b_cookie_found) {
                return null;
            }
        },


        setCookie: function (cookie) {

            var now     = new Date(),
                expires;

            now.setTime( now.getTime() );

            if (cookie.name !== undefined) {

                if (cookie.expires) {
                    expires = cookie.expires * 1000 * 60 * 60 * 24; // Days
                } else {
                    expires = 3600000; // Default 1 hour
                }

                expires = new Date(now.getTime() + expires);

                document.cookie =
                    cookie.name + '=' + cookie.value +
                    '; expires=' + expires.toUTCString() +
                    '; path=/' +
                    '; domain=.' + this.getBaseDomain(window.location.hostname);

            }
        },

        getBaseDomain: function(hostname) {
            const parts = hostname.split('.');
            const length = parts.length;

            if (length > 2) {
                return parts.slice(-2).join('.');
            }

            return hostname;
        },

        validateForm: function (obj, validateObj) {

            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // Fields without validation functions, validate length only.
                    if ($.inArray(key, validateObj.inputs) > -1) {
                        if ($(obj[key]).val().trim().length > 0) {
                            $(obj[key]).closest('.form-group').removeClass('has-error');
                        } else {
                            $(obj[key]).closest('.form-group').addClass('has-error');
                        }
                    }

                    if ($.inArray(key, validateObj.textarea) > -1) {
                        if ($(obj[key]).val().trim().length < 10) {
                            $(obj[key]).closest('.form-group').addClass('has-error');
                        } else {
                            $(obj[key]).closest('.form-group').removeClass('has-error');
                        }
                    }

                    if ($.inArray(key, validateObj.zipcode) > -1) {

                        if ($(obj[key]).val().trim().length > 3 && $(obj[key]).val().length < 5) {
                            $(obj[key]).closest('.form-group').removeClass('has-error');
                        } else {
                            $(obj[key]).closest('.form-group').addClass('has-error');
                        }
                    }

                    // If first option is selected, show error.
                    if ($.inArray(key, validateObj.selects) > -1) {

                        if ($(obj[key]).prop('selectedIndex') < 1) {
                            $(obj[key]).closest('.form-group').addClass('has-error');
                        } else {
                            $(obj[key]).closest('.form-group').removeClass('has-error');
                        }
                    }

                    // Match two fields
                    if ($.inArray(key, validateObj.match) > -1) {

                        if ($(obj[key][0]).val() !== $(obj[key][1]).val()) {
                            $(obj[key][1]).closest('.form-group').addClass('has-error');
                        } else {
                            $(obj[key][1]).closest('.form-group').removeClass('has-error');
                        }
                    }

                    // Fields with email validation
                    if ($.inArray(key, validateObj.validateEmail) > -1) {

                        if (!this.validateEmail($(obj[key]).val())) {
                            $(obj[key]).closest('.form-group').addClass('has-error');
                        } else {
                            $(obj[key]).closest('.form-group').removeClass('has-error');
                        }
                    }

                    // Fields with msisdn validation
                    if ($.inArray(key, validateObj.validateNorwegianMsisdn) > -1) {

                        if (!this.validateNorwegianMsisdn($(obj[key]).val())) {
                            $(obj[key]).closest('.form-group').addClass('has-error');
                        } else {
                            $(obj[key]).closest('.form-group').removeClass('has-error');
                        }
                    }
                }
            }
        },



        /** CLOCK COUNTDOWN FOR TOKENS
         *
         * When time is up we trigger a event called '/clock_stop'. Listen on that if you want to do something fancy.
         */
        startClock: function (timestamp) {
            if (!timestamp) {
                return;
            }

            var self = this;
            var timer;

            window.start = parseFloat(timestamp);

            if (!isNaN(window.start) && typeof window.start === "number") {
                window.start = window.start - 1;
                if (window.start >= 0) {
                    timer = setTimeout(function () {
                        self.updateClock()
                    }, 1000);
                } else {
                    clearTimeout(timer);
                    $(document).trigger('/clock_stop');
                }
            } else {
                window.start = 0;
            }
        },

        updateClock: function () {
            this.startClock(window.start);
        },

        debounce: function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },

        initVimeoPlayerEmbed: function ($playButton, options, callback) {
            if (typeof Vimeo !== 'object') {
                return;
            }

            var elementId = $playButton.data('player-id');
            var $playerContainer = $('#' + elementId);

            if ($playerContainer.hasClass('vimeo-loading') || $playerContainer.hasClass('vimeo-loaded')) {
                return;
            }

            $playerContainer.addClass('video-loading');
            $playerContainer.parent().find('.video-error').remove();

            var player = new Vimeo.Player(elementId, {
                url: $playButton.attr('href'),
                width: 640,
                autoplay: true
            });

            player.ready().catch(function(resp) {
                APP.utils.ajaxLogger({
                    type: 'error',
                    message: '[ERROR] vimeo ('+window.location.href+'): ' + resp.message,
                })

                $playerContainer.parent().append('<div class="video-error slide-in">' + $t('En feil oppsto under avspilling, prøv igjen.') + '</div>');
                $playButton.removeClass('d-none');
                $playerContainer.removeClass('video-loading');

                // Cleanup the player and remove from dom
                player.destroy();
            })

            // some mobile browsers won't allow autoplay without muting the video
            if (APP.core.isMobile()) {
                player.setMuted(true);
            }


            if ($playerContainer.data('seekable') === false) {
                var watched15Sec = false;
                var watched5Sec = false;
                var timeWatched = 0;

                player.on("timeupdate", function(data) {
                    if (data.seconds - 1 < timeWatched && data.seconds > timeWatched) {
                        timeWatched = data.seconds;
                    }

                    if (data.seconds <= timeWatched && options.triggerCallbackNearEnd) {
                        if (!watched15Sec && (data.duration - timeWatched) < 15) {
                            watched15Sec = true;
                            if (callback && typeof callback === "function") {
                                callback(elementId);
                            }
                        }

                        if (!watched5Sec && (data.duration - timeWatched) < 5) {
                            watched15Sec = true;
                            if (callback && typeof callback === "function") {
                                callback(elementId);
                            }
                        }
                    }
                });

                player.on("seeked", function(data) {
                    if (timeWatched < data.seconds) {
                        player.setCurrentTime(timeWatched);
                    }
                });
            }

            player.on('play', function() {
                if (!$playerContainer.data('play') && options.origin) {
                    $playerContainer.data('play', true)
                    APP.utils.pushGoogle('user-action', options.origin, 'play-video');
                }
            });

            player.on('ended', function () {
                if (!$playerContainer.data('ended') && options.origin) {
                    $playerContainer.data('ended', true)
                    APP.utils.pushGoogle('user-action', options.origin, 'finished-video');
                }

                if (callback && typeof callback === "function") {
                    callback(elementId);
                }
            })

            player.on('loaded', function() {
                $playButton.addClass('d-none');
                $playerContainer.removeClass('video-loading').addClass('video-loaded');
            });
        },

        /**
         * Using new vimeo player sdk
         * @param elementId
         * @param origin
         * @param callback
         * @param options
         */
        initVimeoPlayerEvents: function (elementId, origin, callback, options) {
            if (typeof Vimeo !== 'object') {
                return;
            }

            var $playerIframe = $('#' + elementId);

            var player = new Vimeo.Player(elementId);
            player.ready().then(function() {

                if ($playerIframe.data('seekable') === false) {
                    var isWatched15Sec = false;
                    var isWatched5Sec = false;
                    var timeWatched = 0;

                    player.on("timeupdate", function(data) {
                        if (data.seconds - 1 < timeWatched && data.seconds > timeWatched) {
                            timeWatched = data.seconds;
                        }

                        if (data.seconds <= timeWatched && options.triggerCallbackNearEnd) {
                            if (!isWatched15Sec && (data.duration - timeWatched) < 15) {
                                isWatched15Sec = true;
                                if (callback && typeof callback === "function") {
                                    callback(elementId);
                                }
                            }

                            if (!isWatched5Sec && (data.duration - timeWatched) < 5) {
                                isWatched5Sec = true;
                                if (callback && typeof callback === "function") {
                                    callback(elementId);
                                }
                            }
                        }
                    });

                    player.on("seeked", function(data) {
                        if (timeWatched < data.seconds) {
                            player.setCurrentTime(timeWatched);
                        }
                    });
                }

                player.on('play', function() {
                    if (!$playerIframe.data('play')) {
                        $playerIframe.data('play', true)
                        APP.utils.pushGoogle('user-action', origin, 'play-video');
                    }
                });

                player.on('ended', function () {
                    if (!$playerIframe.data('ended')) {
                        $playerIframe.data('ended', true)
                        APP.utils.pushGoogle('user-action', origin, 'finished-video');
                    }

                    if (callback && typeof callback === "function") {
                        callback(elementId);
                    }
                })
            });
        },

        siteNotification: function (obj) {

            var self = this;
            if (obj.message) {

                APP.modal.show({
                    modalHeader: {
                        content: obj.title || '',
                        classes: [obj.modalHeaderClasses]
                    },
                    modalBody: {
                        content: obj.message
                    },
                    modalFooter: {
                        content: '<a href="#" class="btn ' + (obj.modalFooterClass ? obj.modalFooterClass : 'btn-default') + '" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    }
                });

                if (obj.redirect !== undefined) {
                    $('.modal').on('hidden.bs.modal',  function() {
                        self.redirect(obj.redirect);
                    });
                }
            }
        },

        isElementInViewport: function (el, offset) {
            if (!offset) {
                offset = 0;
            }
            var rect = el.getBoundingClientRect();
            var windowHeight = (window.innerHeight || document.documentElement.clientHeight);

            return ((rect.top + offset) <= windowHeight) && (((rect.top + offset) + rect.height) >= 0);
        },

        createIntersectionObserver: function(elem, callback, options) {
            if (!elem) {
                return;
            }


            var observer = new IntersectionObserver(callback, options || {});
            // observer.USE_MUTATION_OBSERVER = false; // don't check for intersections when DOM changes
            observer.observe(elem);

            return observer
        },

        copyToClipboard: function(element, value) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(value).select();
            document.execCommand("copy");
            $temp.remove();
            $(element).find('svg').addClass('single-pulse').delay(300).queue(function(){
                $(this).removeClass("single-pulse").dequeue();
            });
        },

        waitForImagesToLoad: async function (element) {
            if (!element) {
                return Promise.resolve();
            }
            const elementPosition = element.getBoundingClientRect()?.top;
            const images = document.querySelectorAll('img');

            const promises = Array.from(images).map(img => {
                if (img.complete || img.getBoundingClientRect()?.top > elementPosition) {
                    return Promise.resolve();
                }
                img.loading = 'eager';

                return new Promise(resolve => img.addEventListener('load', resolve, { once: true }));
            });

            return Promise.all(promises);
        },


        scrollToElement: function (selector){
            const element = document.querySelector(selector);
            if(!element){
                return;
            }

            window.scrollTo({
                top: element.getBoundingClientRect().top + window.scrollY - 25,
                behavior: 'smooth'
            })
        },

        switchTheme: function (element) {
            const activeTheme = document.documentElement.getAttribute('data-bs-theme');
            const currentTheme = activeTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-bs-theme', currentTheme)

            this.setCookie({
                name:    'theme',
                value:   currentTheme,
                expires: 30
            });
        },

        initTooltips: function() {
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            if (tooltipTriggerList && tooltipTriggerList.length) {
                tooltipTriggerList.forEach(function(tooltipTriggerEl) {
                    new bootstrap.Tooltip(tooltipTriggerEl)
                });
            }
        },

        initPopovers: function (selector, options) {
            const popoverTriggerList = document.querySelectorAll(selector);
            if (popoverTriggerList && popoverTriggerList.length) {

                popoverTriggerList.forEach(function(popoverTriggerEl) {
                    const popoverTarget = popoverTriggerEl.getAttribute('data-bs-target');
                    const popoverTargetEl = document.querySelector(popoverTarget)

                    let popover = bootstrap.Popover.getInstance(popoverTriggerEl)

                    if (!popover) {
                        popover = new bootstrap.Popover(popoverTriggerEl, {
                            html: true,
                            sanitize: false,
                            container: '.root-container',
                            content: popoverTargetEl ? popoverTargetEl.innerHTML : '',
                            trigger: options.trigger
                        });

                        if (options.trigger === 'manual') {
                            popoverTriggerEl.addEventListener('click', function(event) {
                                event.preventDefault();
                                event.stopPropagation();
                                popover.toggle();
                            });
                        }
                    }

                });

                if (options.trigger === 'manual' && !this.popoverEventListenerAdded) {
                    document.addEventListener('click', function(event) {
                        if (event.target.closest('.popover')) {
                            return;
                        }

                        document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function (popover) {
                            bootstrap.Popover.getInstance(popover).hide();
                        })
                    });
                    this.popoverEventListenerAdded = true;
                }
            }
        }
    };

})();

var __local = __local || {};
__local = (function () {
    "use strict";

    return {
        getUser:function(){
            var __user;
            try{
                if(store && store.enabled ) {
                    __user = store.get('user');
                    if(!__user){
                        __user = store.set('user', { history: [], jsError: [], userAgent: navigator.userAgent });
                    }else{
                        if(!__user.history){
                            __user.history = [];
                        }
                        if(!__user.jsError){
                            __user.jsError = [];
                        }
                        __user = store.set('user', { history: __user.history, jsError: __user.jsError, userAgent: navigator.userAgent });
                    }
                }
            }catch(err){/*Ignore error*/}
            return __user;
        },
        pushHistory:function(action){
            try{
                var __user = this.getUser();
                if(__user && __user.history){
                    if(__user.history.length >= 100){
                        __user.history.pop();
                    }
                    __user.history.unshift(action);
                    store.set('user', { history: __user.history, jsError: __user.jsError, userAgent: navigator.userAgent });
                }
            }catch(err){/*Ignore error*/}
        },
        resetStore:function(){
            try{
                var __user = this.getUser();
                if(__user && __user.history){
                    store.set('user', { history: [], jsError: [], userAgent: navigator.userAgent });
                }
            }catch(err){/*Ignore error*/}
        },
        pushError:function(error){
            try{
                var __user = this.getUser();
                if(__user && __user.jsError){
                    if(__user.jsError.length >= 10){
                        __user.jsError.pop();
                    }
                    var payload = {error: error, url: window.location.href, timestamp: Date('now')};
                    __user.jsError.unshift(payload);
                    store.set('user', { history: __user.history, jsError: __user.jsError, userAgent: navigator.userAgent });
                }
            }catch(err){/*Ignore error*/}
        }
    }
})();


// Polyfills
if ( !Object.prototype.hasOwnProperty ) {
	Object.prototype.hasOwnProperty = function(prop) {
		var proto = this.__proto__ || this.constructor.prototype;
		return (prop in this) && (!(prop in proto) || proto[prop] !== this[prop]);
	};
}


// handler for client side browser errors
window.onerror = function (msg, file, line, col, err) {
    "use strict";
    var dontLog = [
        'Error loading script',
        'Script error.',
        'Object required',
        'postMessage', // cause: plusone apis.google.com
        'getElementById(a).src', // cause: plusone apis.google.com
        'NPObject', // cause: symantec norton
        '__gCrWeb', // cause: google chrome for iOS
        'checkSessionState', // cause: plusone apis.google.com
        'Kan ikke hente egenskapen src', // cause: plusone apis.google.com
        'DealPly'
    ];

    var log = true;
    var message = msg;

    if (msg) {
        for (var i = 0; i < dontLog.length; i++) {
            if (msg.indexOf(dontLog[i]) > -1) {
                log = false;
                break;
            }
        }
    }

	if (log && (!file || file.startsWith(window.location.protocol + '//' + window.location.hostname))) {
        if (onerror.num++ < onerror.max) {
            var errorObj = {
                "message": msg,
                "url": document.location.href,
                "handled_by": "window.onerror",
                "file": file,
                "line": line + (col ? ":" + col : "")
            };

            if(__local){
                __local.pushError(errorObj);
            }

            message += "\n" + JSON.stringify(errorObj, null, 4);

            if (err !== undefined) {
                message += "\nstack: " + err.stack;
            }

            $.ajax({
                type: 'POST',
                url: '/ajax/log',
                data: {"type": "client", "message": message}
            });

            //return true;
        }
	}
};
onerror.max = 5;
onerror.num = 0;