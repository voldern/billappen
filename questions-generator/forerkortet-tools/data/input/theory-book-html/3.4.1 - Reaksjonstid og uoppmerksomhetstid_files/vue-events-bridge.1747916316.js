/**
 * Acts as a receiver for events dispatched through SlideEventDispatcher.ts
 */
document.addEventListener("vue:course:hide-exam-modal", function (event) {
    if (event.detail) {

        const examModal = bootstrap.Modal.getInstance('#exam-modal-' + event.detail.slideId);
        if (examModal) {
            examModal.hide();
        }
    }
});

document.addEventListener("vue:course:mark-questions-completed", function (event) {
    if (event.detail) {
        if (event.detail.faultCount !== undefined) {
            APP.teorikurs.questionsCompleted(event.detail.slideId, event.detail.faultCount);
        } else {
            APP.teorikurs.markSlideCompleted(event.detail.slideId);
        }
    }
})

document.addEventListener("vue:course:show-exam-modal", function (event) {
    if (event.detail) {
        const examModalId = 'exam-modal-' + event.detail.slideId;

        try {
            const examModal = new bootstrap.Modal(document.getElementById(examModalId), {
                backdrop: 'static',
                keyboard: true
            })

            examModal.show();
            legacyStopSounds();
        } catch (e) {
            console.error(`Could not find modal id: ${examModalId}, event: vue:course:show-exam-modal`);
        }
    }
});


document.addEventListener("vue:course:hide-exam-modal-callback", function (event) {
    legacyStopSounds();
});



document.addEventListener("vue:course:toggle-slide-keyboard-navigation", function (event) {
    if (event.detail) {
        APP.teorikurs.addSettings({enableKeyboardNavigation: event.detail.enabled});
    }
});

function legacyStopSounds () {
    if (typeof Howler !== "undefined" && typeof Howler == 'object') {
        Howler.stop();
    }
}
document.addEventListener("vue:course:stop-sounds", function () {
    if (typeof Howler !== "undefined" && typeof Howler == 'object') {

        Howler.stop();
    }
});

document.addEventListener("vue:course:bookmark:deleted", function (event) {
    if (document.querySelector('.saved-slides').children.length === 0) {
        document.querySelectorAll('.js-toogle-visible').forEach((item) => {
            item.classList.toggle('d-none');
        })
    }
});