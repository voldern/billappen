var APP = APP || {};
APP.teorikurs = (function () {
    "use strict";

    var class_id = null;
    var course_id = null;
    var search_language;
    var settings = {
        enableKeyboardNavigation: true
    };

    // forced nagivation with required resource types
    var navigation = {
        slides: [],
        resourceTypes: {
            video: {
                selector: '.vimeo-video-card',
                modal: {
                    title:   'Video',
                    message: $t('Du må se hele videoen for å kunne gå videre.')
                }
            },
            question: {
                selector: '.slide-question',
                modal: {
                    title: $t('Manglende svar'),
                    message: $t('Du må svare korrekt på oppgavene for å kunne gå videre.')
                }
            },
            // TODO: fix fix
            open_question: {
                selector: '.open-question-holder',
                modal: {
                    title: $t('Manglende svar'),
                    message: $t('Du må avgi et svar for å kunne gå videre.')
                }
            }
        }
    }


    return {

        setSlides: function (slides) {
            navigation.slides = slides;
        },

        getSlides: function () {
            return navigation.slides;
        },

        setSlideState: function() {
            navigation.slides.forEach(function(slide) {
                slide.saved = slide.completed;

                var $ele = $('.slide[data-page-id="' + slide.id + '"]');
                if ($ele.has(navigation.resourceTypes.video.selector).length === 0
                    && $ele.has(navigation.resourceTypes.question.selector).length === 0
                    && $ele.has(navigation.resourceTypes.open_question.selector).length === 0) {
                    slide.completed = true;
                }
            });

            return this;
        },

        getUncompletedSlides: function() {
            return navigation.slides.filter(function(slide) {
                return slide.completed === false;
            });
        },

        getUnsavedCompletedSlides: function() {
            return navigation.slides.filter(function(slide) {
                return slide.saved === false && slide.completed === true;
            });
        },

        markSlideCompleted: function (pageId) {
            var slideIndex = navigation.slides.findIndex(function(slide) {
                return slide.id === pageId;
            });

            if (slideIndex > -1 && navigation.slides[slideIndex]) {
                if (navigation.slides[slideIndex].completed === true) {
                    return;
                }

                navigation.slides[slideIndex].completed = true;
                this.saveCompletedSlides();
            }
        },

        markUnsavedSlidesAsSaved: function () {
            this.getUnsavedCompletedSlides().forEach(function(slide) {
                slide.saved = true;
            });
        },

        saveCompletedSlides: function () {
            if (this.getUnsavedCompletedSlides().length === 0) {
                return;
            }

            var self = this;
            $.ajax('/teorikurs/saveCompletedSlides', {
                type: 'post',
                dataType: 'json',
                data: {
                    class_id: self.getClassId(),
                    course_id: self.getCourseId(),
                    pages: self.getUnsavedCompletedSlides()
                }
            }).done(function() {
                self.markUnsavedSlidesAsSaved();
            }).fail(function() {
                APP.modal.showSimpleAlert($t('En feil oppsto'), $t('Vennligst gå tilbake og prøv igjen.'), '/teorikurs/' + self.getSettings('class_info').course_path);
            });
        },

        showFirstUncompletedSlideStateModal: function () {
            var uncompletedSlide = this.getUncompletedSlides()[0];
            if (uncompletedSlide) {
                var $ele = $('.slide[data-page-id="' + uncompletedSlide.id + '"]');

                var resourceTypes = Object.keys(navigation.resourceTypes);
                for (var i = 0; i < resourceTypes.length; i++) {
                    if ($ele.has(navigation.resourceTypes[resourceTypes[i]].selector).length > 0) {
                        APP.modal.showSimpleAlert(navigation.resourceTypes[resourceTypes[i]].modal.title, navigation.resourceTypes[resourceTypes[i]].modal.message);
                        return;
                    }
                }
            }
        },

        stickyBackToTop: function() {
            if ($('.sticky-back-to-top').length > 0) {
                var isSticky = false;
                var breakPoint = 450;
                var stickyBackFn = APP.utils.debounce(function () {

                    if (window.scrollY >= breakPoint && !isSticky) {
                        $('.sticky-back-to-top').addClass('show');
                        isSticky = true;
                    } else if (isSticky && window.scrollY < breakPoint) {
                        $('.sticky-back-to-top').removeClass('show');
                        isSticky = false;
                    }
                }, 400);

                $(window).on('scroll', stickyBackFn);
            }
        },

        setCourseId: function(id) {
            course_id = id;
        },

        getCourseId: function() {
            return course_id;
        },

        setClassId: function(id) {
            class_id = id;
        },

        getClassId: function() {
            return class_id;
        },

        setLanguage: function(language) {
            search_language = language;
        },

        getLanguage: function() {
            return search_language;
        },

        addSettings: function(values) {
            $.extend(settings, values);
        },

        getSettings: function(key) {
            if (key) {
                return settings[key];
            }
            return settings;
        },

        image_carousel: function (elm) {
            if (elm.parent().hasClass('active')) {
                return;
            } else {
                var $root = elm.closest('.image-carousel');
                var $holder_thumb = $root.find('.image-holder .thumbnail');
                var $holder_img = $root.find('.image-holder .thumbnail img');
                var $holder_subtitle = $root.find('.image-holder .subtitle');
                var elm_img = elm.find('img');

                $holder_thumb.attr({href: elm.attr('href'), title: elm.attr('title')});
                $holder_subtitle.html(elm.attr('title'));
                $holder_img.attr({src: elm_img.attr('src')}).data({large: elm_img.data('large')})

                elm.closest('.thumbnails').find('div').removeClass('active');
                elm.parent().addClass('active');
            }
        },

        keyboard_navigation: function (e) {
            if (!settings.enableKeyboardNavigation) {
                return;
            }

            if (e.keyCode === 39) {
                if ($('.next-page').length > 0) {
                    $('.next-page')[0].click();
                }
            } else if (e.keyCode === 37) {
                if ($('.prev-page').length > 0) {
                    $('.prev-page')[0].click();
                }
            }
        },

        sendCourseFeedback: function(element, messageElementId, classId, userId) {
            let modalBodyEl = element.closest('.modal').querySelector('.modal-body');
            let statusEl = modalBodyEl.querySelector('.status');

            let payload = {
                user_id: userId,
                message: document.querySelector(messageElementId).value.trim(),
                ref_url: window.location.href
            };

            statusEl.innerHTML = '';

            APP.utils.loadingButton(element, true);

            if (payload.message.length < 3) {
                modalBodyEl.querySelector('.status').innerHTML = '<div class="alert alert-warning">' + $t('Meldingen er for kort.') + '</div>';

                setTimeout(function() {
                    statusEl.innerHTML = '';
                    APP.utils.loadingButton(element, false);
                }, 3000);

                return;
            }

            $.ajax({
                url: `/course/${classId}/feedback`,
                type: 'POST',
                data: JSON.stringify(payload),
                contentType: 'application/json',
                dataType: 'json'
            }).done(function (response) {
                if (response.status) {
                    modalBodyEl.innerHTML = '<div class="alert alert-success">' + response.message + '</div>';
                    element.remove();
                } else {
                    statusEl.innerHTML = '<div class="alert alert-danger">' + response.message + '</div>';
                }
            }).always(function() {
                APP.utils.loadingButton(element, false);
            });
        },

        openQuestionLockedModal: function(element) {
            $(element).prop({disabled: true});
            APP.modal.show({
                modalHeader: {
                    content: '<svg class="icon icon-alert-triangle-big"><use xlink:href="' + window.LGD.svgSpriteUrl + '#alert-triangle-big"></use></svg>' + $t('Krav til tidsbruk')
                },
                modalBody: {
                    content: $(element).next().html()
                },
                modalFooter: {
                    content: [
                        '<a href="#" class="btn btn-primary" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    ]
                }
            });
            $(element).prop({disabled: false});
        },

        showSearchModal: function(action, title, searchType) {
            if (!action) {
                return;
            }

            const template = document.createElement('template');

            template.innerHTML = `<div class="modal search-modal fade" id="dialog" tabindex="-1" aria-labelledby="search-modal-label" aria-hidden="true">
                                    <div class="modal-dialog">
                                        <div class="modal-content">
                                            <div class="modal-body p-2">
                                               <form class="search-form" method="get" action="${action}" role="search">
                                                    <input type="hidden" name="type" value="${searchType}">
                                                    <div class="input-group input-group-lg">
                                                        <input type="search" class="form-control search-input" name="s" autocomplete="off" placeholder="${title}" aria-label="${title}" required>
                                                        <button type="submit" class="btn btn-primary submit-search-button">
                                                            <svg class="icon icon-32 icon-search">
                                                                <use xlink:href="${window.LGD.svgSpriteUrl}#search"></use>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                  </div>`;

            const modalElement = template.content.firstChild;
            const bsModal = APP.modal.render(modalElement, {});
            bsModal.show();

            modalElement.addEventListener('shown.bs.modal', function() {
                this.querySelector('.search-input').focus();
            }, {once: true});
        },

        questionsCompleted: function(pageId, faultCount) {
            if (APP.teorikurs.getSettings('require_slide_completion') && !APP.teorikurs.getSettings('require_correct_answers')) {
                APP.teorikurs.markSlideCompleted(pageId);
                return;
            }

            if (APP.teorikurs.getSettings('require_correct_answers') && faultCount === 0) {
                APP.teorikurs.markSlideCompleted(pageId);
            }
        },

        videoPlaybackEnded: function(elementId) {
            if (APP.teorikurs.getSettings('require_slide_completion')) {
                APP.teorikurs.markSlideCompleted($('#' + elementId).closest('.slide').data('page-id'));
            }
        },

        pushNavigationEvent: function (element, slideId) {
            APP.utils.loadingButton(element, true);

            document.dispatchEvent(
                new CustomEvent('pushNavigationEvent', {
                    bubbles: false,
                    detail: {
                        slideId: slideId
                    }
                })
            );

            setTimeout(function() {
                APP.utils.loadingButton(element, false)
            }, 200);
        },

        toggleTeacherView: function (element, slideId, template) {
            element.innerText = element.innerText === element.dataset.textPrimary ? element.dataset.textSecondary : element.dataset.textPrimary;

            document.dispatchEvent(
                new CustomEvent('teacherViewEvent', {
                    bubbles:true,
                    detail: {
                        slideId: slideId,
                        template: template
                    }
                })
            );
        },

        showCourseFeedbackForm: function (element, title, classId, userId) {
            APP.modal.show({
                modalHeader: {
                    content: title
                },
                modalBody: {
                    content: `<div class="mb-3 text-start">
                                 <label class="form-label">${$t('Skriv inn din melding')}:</label>
                                 <textarea rows="5" name="message" id="course-contact-message" class="form-control"></textarea>
                             </div>
                             <div class="status"></div>`
                },
                modalFooter: {
                    content: [
                        `<button class="btn btn-primary" data-target="#course-contact-message" onclick="APP.teorikurs.sendCourseFeedback(this, '#course-contact-message', ${classId}, ${userId}); return false;">${$t('Send melding')}</button>`,
                        '<a href="#" class="btn btn-default" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    ]
                }
            });
        },

        showCourseExamDeletionModal: function (element, title, classId) {
            APP.modal.show({
                modalHeader: {
                    content: title
                },
                modalBody: {
                    content: `<p>Er du sikker?</p><p>Dette sletter svarene du selv har avgitt på oppgavene i kurset, og det gir deg nyeste versjon av alle oppgaver.</p><div class="status"></div>`
                },
                modalFooter: {
                    content: [
                        `<button class="btn btn-primary" onclick="APP.teorikurs.deleteCourseExams(this, ${classId}); return false;">Ja, jeg er sikker</button>`,
                        '<a href="#" class="btn btn-default" data-bs-dismiss="modal">' + $t('Lukk') + '</a>'
                    ]
                }
            });
        },

        async deleteCourseExams(element, classId) {
            APP.utils.loadingButton(element, true);

            const modalEl = element.closest('.modal');
            const statusEl = modalEl.querySelector('.status');

            try {
                statusEl.innerHTML = '';

                const response = await fetch(`/course/${classId}/delete_exams`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });

                const result = await response.json();

                if (response.ok) {
                    const modalBodyEl = modalEl.querySelector('.modal-body');
                    modalBodyEl.innerHTML = '<div class="alert alert-success">Oppgavehistorikken er nå slettet.</div>';
                    element.remove();
                } else {
                    statusEl.innerHTML = '<div class="alert alert-danger">' + result.error.message + '</div>';
                }
            } catch (error) {
                statusEl.innerHTML = '<div class="alert alert-danger">' + $t('En feil oppsto. Vennligst prøv igjen senere.') + '</div>';
            } finally {
                if (element) {
                    APP.utils.loadingButton(element, false);
                }
            }
        }
    };

})();

$(function() {
    APP.utils.initPopovers('.term-popover', { trigger: 'manual' });
    APP.teorikurs.stickyBackToTop();

    if ($('.vimeo-api-iframe').length > 0) {
        $.each($('.vimeo-api-iframe'), function() {
            APP.utils.initVimeoPlayerEvents($(this).attr('id'), 'teorikurs', APP.teorikurs.videoPlaybackEnded, {
                triggerCallbackNearEnd: APP.teorikurs.getSettings('require_slide_completion')
            });
        })
    }

    $(document).on('click', '.js-vimeo-player', function (e) {
        e.preventDefault();
        APP.utils.initVimeoPlayerEmbed($(this), {
            origin: 'teorikurs',
            triggerCallbackNearEnd: APP.teorikurs.getSettings('require_slide_completion')
        }, APP.teorikurs.videoPlaybackEnded);
    });

    $('a.back-to-top').on('click', function(e) {
        e.preventDefault();

        $("html, body").animate({
            scrollTop: 0
        }, 300);
    });

    $('a.navigate-to').on('click', function(e) {
        e.preventDefault();

        $("html, body").animate({
            scrollTop: $($(this).attr('href')).position().top + 90
        }, 300);
    });


    // carousel
    $('.slide .thumbnails .thumbnail').on('click', function (e) {
        e.preventDefault();
        APP.teorikurs.image_carousel($(this));
    });
    $('.slide .thumbnails .thumbnail').hover(function () {
        APP.teorikurs.image_carousel($(this));
    });


    // navigate with right/left arrow, next/prev page
    $('body').on('keyup', function (e) {
        if ($(e.target).is('input') === false && $(e.target).is('textarea') === false) {
            APP.teorikurs.keyboard_navigation(e);
        }
    });

    $.fancybox.defaults.beforeShow = function() {
        APP.teorikurs.addSettings({enableKeyboardNavigation: false});
    }

    $.fancybox.defaults.afterClose = function(instance, slide) {
        const image = slide.opts && slide.opts.$orig ? slide.opts.$orig[0] : null;
        const isTriggerImage = instance.$trigger && instance.$trigger[0] === image;
        const isGallery = instance.group && instance.group.length > 1;

        if (image && isGallery && !isTriggerImage) {
            image.scrollIntoView({block: 'center'});
        }
        APP.teorikurs.addSettings({enableKeyboardNavigation: true});
    }

    $(document).on('click', '.slide-footer li.active a', function(e) {
        e.preventDefault();
        $(this).parent().removeClass('active');
        $($(this).attr('href')).removeClass('active');
    });


    $('.modal-exam').on('hide.bs.modal', function(){
        document.dispatchEvent(new CustomEvent('vue:course:hide-exam-modal-callback', {
            bubbles: true
        }));
    });


    window.onhashchange = function (event) {
        let slideId = parseInt(window.location.hash.slice(1), 10);

        if (!slideId) {
            return;
        }

        scrollToSlide(slideId);
    };

    if (window.location.hash) {
        scrollToSlide(parseInt(window.location.hash.slice(1), 10));
    }
});

async function scrollToSlide(slideId) {
    if (!slideId) {
        return;
    }

    let pageElement = document.querySelector('[data-page-id="' + slideId + '"]');

    await APP.utils.waitForImagesToLoad(pageElement);

    if (pageElement) {
        APP.utils.scrollToElement('[data-page-id="' + slideId + '"]');
    } else {
        APP.utils.scrollToElement('[data-term-id="' + slideId + '"]');
    }
}

$.extend({
    highlight: function (node, re, nodeName, className) {
        if (node.nodeType === 3) {
            var match = node.data.match(re);
            if (match) {
                var highlight = document.createElement(nodeName || 'span');
                highlight.className = className || 'search_hit';
                var wordNode = node.splitText(match.index);
                wordNode.splitText(match[0].length);
                var wordClone = wordNode.cloneNode(true);
                highlight.appendChild(wordClone);
                wordNode.parentNode.replaceChild(highlight, wordNode);
                return 1; //skip added node in parent
            }
        } else if ((node.nodeType === 1 && node.childNodes) && // only element nodes that have children
            !/(script|style)/i.test(node.tagName) && // ignore script and style nodes
            !(node.tagName === nodeName.toUpperCase() && node.className === className)) { // skip if already highlighted
            for (var i = 0; i < node.childNodes.length; i++) {
                i += $.highlight(node.childNodes[i], re, nodeName, className);
            }
        }
        return 0;
    }
});

$.fn.highlight = function (words, options) {
    var settings = { className: 'search_hit', element: 'span', caseSensitive: false, wordsOnly: true };
    $.extend(settings, options);

    if (words.constructor === String) {
        words = [words];
    }
    words = $.grep(words, function (word, i) {
        return word !== '';
    });
    words = $.map(words, function (word, i) {
        return word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    });
    if (words.length === 0) {
        return this;
    }

    var flag = settings.caseSensitive ? "" : "i";
    var pattern = "(" + words.join("|") + ")";

    // Word boundary (only highlight entire matches, not partial matched word)
    // if (settings.wordsOnly) {
    //     pattern = "\\b" + pattern + "\\b";
    // }
    var re = new RegExp(pattern, flag);

    return this.each(function () {
        $.highlight(this, re, settings.element, settings.className);
    });
};
