/**
 * Order Chat Module
 * Handles the communication widget between bidder and seller.
 */

let chatOrderId = null;
let isSendingMessage = false;

/**
 * Initialize chat widget
 * @param {string} orderId 
 */
function initOrderChat(orderId) {
    chatOrderId = orderId;

    // 1. Initial scroll to bottom
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 2. Refresh messages periodically (optional, e.g., every 10s)
    setInterval(refreshChatMessages, 10000);
}

/**
 * Toggle chat widget minimize/maximize
 */
function toggleChat() {
    const chatWidget = document.getElementById('chatWidget');
    const toggleBtn = document.getElementById('chatToggleBtn');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatWidget || !toggleBtn) return;

    chatWidget.classList.toggle('minimized');

    // Change icon and scroll if maximized
    if (chatWidget.classList.contains('minimized')) {
        toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i>';
    } else {
        toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i>';
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

/**
 * Send a chat message
 */
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !chatOrderId) return;

    const message = input.value.trim();
    if (!message || isSendingMessage) return;

    // Set flag and temporary state
    isSendingMessage = true;
    input.disabled = true;
    const originalValue = input.value;
    input.value = 'Sending...';

    try {
        const response = await fetch(`/products/order/${chatOrderId}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const result = await response.json();

        if (result.success) {
            input.value = '';
            await refreshChatMessages();
        } else {
            input.value = originalValue;
            showChatToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        input.value = originalValue;
        showChatToast('An error occurred', 'error');
    } finally {
        input.disabled = false;
        isSendingMessage = false;
        input.focus();
    }
}

/**
 * Fetch and update chat messages
 */
async function refreshChatMessages() {
    if (!chatOrderId || isSendingMessage) return;

    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    try {
        const response = await fetch(`/products/order/${chatOrderId}/messages`);
        const data = await response.json();

        if (data.success) {
            const oldScrollTop = chatMessages.scrollTop;
            const oldScrollHeight = chatMessages.scrollHeight;
            const isAtBottom = oldScrollTop + chatMessages.clientHeight >= oldScrollHeight - 50;

            // Update HTML
            chatMessages.innerHTML = data.messagesHtml || '';

            // Scroll to bottom if user was already at bottom or if it's the first load
            if (isAtBottom) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Refresh chat error:', error);
    }
}

/**
 * Show a small toast notification for chat errors
 */
function showChatToast(message, icon = 'info') {
    Swal.fire({
        icon: icon,
        text: message,
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
    });
}

// Global exposure
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
window.initOrderChat = initOrderChat;
