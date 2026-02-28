/**
 * Product Detail Page - Comment & Reply Logic
 */

function initComments() {
    // Comment Form Submission Protection
    const commentForm = document.querySelector('.comment-form form');
    if (commentForm) {
        commentForm.addEventListener('submit', function (e) {
            handleCommentSubmit(this, e);
        });
    }

    // Reply Button
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const commentId = this.getAttribute('data-comment-id');
            const userName = this.getAttribute('data-user-name');
            showReplyForm(commentId, userName, this);
        });
    });

    // Cancel Reply
    document.querySelectorAll('.cancel-reply').forEach(btn => {
        btn.addEventListener('click', function () {
            const commentId = this.getAttribute('data-comment-id');
            hideReplyForm(commentId);
        });
    });

    // Sync contenteditable to hidden input
    document.querySelectorAll('.reply-input').forEach(editor => {
        const form = editor.closest('form');
        if (form) {
            form.addEventListener('submit', function (e) {
                const hiddenInput = form.querySelector('.reply-content-hidden');
                if (hiddenInput) {
                    hiddenInput.value = editor.textContent;
                }
                handleCommentSubmit(form, e);
            });
        }
    });
}

function handleCommentSubmit(form, e) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    if (submitBtn.disabled) {
        e.preventDefault();
        return false;
    }

    submitBtn.disabled = true;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    // Re-enable after a delay (failsafe)
    setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }, 5000);
}

function showReplyForm(commentId, userName, btn) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    const replyInput = replyForm.querySelector('.reply-input');

    if (userName && replyInput) {
        replyInput.innerHTML = `<span class="mention">@${userName}</span>&nbsp;`;
        replyInput.focus();

        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(replyInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    replyForm.style.display = 'block';
    btn.style.display = 'none';
}

function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    const replyBtn = document.querySelector(`.reply-btn[data-comment-id="${commentId}"]`);
    const replyInput = replyForm.querySelector('.reply-input');

    if (replyInput) replyInput.innerHTML = '';
    if (replyForm) replyForm.style.display = 'none';
    if (replyBtn) replyBtn.style.display = 'inline-block';
}

// Export
window.initComments = initComments;
