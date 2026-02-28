/**
 * Admin Product Form — ES Module
 * Shared by add.handlebars and edit.handlebars.
 * Initializes Uppy (thumbnail + sub-images), Cleave.js (price formatting),
 * Quill (rich text editor), and the form submission handler.
 *
 * Expects a global `window.__productFormConfig` object set by the view:
 * {
 *   uploadThumbnailEndpoint: string,
 *   uploadSubimagesEndpoint: string,
 *   initialThumbnail: string,
 *   initialSubImgs: string[],
 *   initialDescription: string,   // HTML string (only for edit)
 *   formId: string,
 *   startPriceId: string,         // element id for starting price input  
 * }
 */
import { Uppy, Dashboard, XHRUpload } from "https://releases.transloadit.com/uppy/v5.2.0/uppy.min.mjs";

const cfg = window.__productFormConfig || {};

// --- State ---
let thumbnail = cfg.initialThumbnail || '';
let subImgs = (cfg.initialSubImgs || []).slice();

// --- Uppy: Main Thumbnail ---
const uppyThumbnail = new Uppy({
    restrictions: {
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp']
    }
});
uppyThumbnail.use(Dashboard, {
    target: '#uppy-thumbnail',
    inline: true,
    height: 300,
    proudlyDisplayPoweredByUppy: false
});
uppyThumbnail.use(XHRUpload, {
    endpoint: cfg.uploadThumbnailEndpoint,
    fieldName: 'thumbnail',
    formData: true
});

uppyThumbnail.on('file-added', function () {
    document.getElementById('thumbnailError').style.display = 'none';
});

uppyThumbnail.on('upload-success', function (file, response) {
    if (response.body.file) {
        thumbnail = response.body.file.filename;
        document.getElementById('txt_thumbnail').value = thumbnail;
    }
});

// --- Uppy: Sub Images ---
const uppySubImages = new Uppy({
    restrictions: {
        maxNumberOfFiles: 10,
        minNumberOfFiles: 3,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp']
    }
});
uppySubImages.use(Dashboard, {
    target: '#uppy-subimages',
    inline: true,
    height: 300,
    proudlyDisplayPoweredByUppy: false
});
uppySubImages.use(XHRUpload, {
    endpoint: cfg.uploadSubimagesEndpoint,
    fieldName: 'images',
    formData: true
});

uppySubImages.on('file-added', function () {
    document.getElementById('subImagesError').style.display = 'none';
});

uppySubImages.on('upload-success', function (file, response) {
    if (response.body.files) {
        response.body.files.forEach(function (f) {
            subImgs.push(f.filename);
        });
        document.getElementById('txt_imgs_list').value = JSON.stringify(subImgs);
    }
});

// --- Quill Editor ---
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Enter detailed product description...',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
        ]
    }
});

// Load existing description if editing
if (cfg.initialDescription) {
    quill.root.innerHTML = cfg.initialDescription;
}

// --- Bind Clear-Error Handlers ---
bindClearErrors([
    { inputId: 'productName', errorId: 'productNameError' },
    { inputId: 'category', errorId: 'categoryError', event: 'change' },
    { inputId: cfg.startPriceId || 'startPrice', errorId: 'startPriceError' },
    { inputId: 'stepPrice', errorId: 'stepPriceError' },
    { inputId: 'buyNowPrice', errorId: 'buyNowPriceError' },
    { inputId: 'endDate', errorId: 'endDateError', event: 'change', useDisplay: true },
    { inputId: 'seller', errorId: 'sellerError', event: 'change' }
]);

// Convert end date on change
document.getElementById('endDate').addEventListener('change', function () {
    if (this.value) {
        document.getElementById('endDateFormatted').value = this.value.replace('T', ' ') + ':00';
    }
});

// Set created_at timestamp
document.addEventListener('DOMContentLoaded', function () {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
        ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    document.getElementById('createdAt').value = ts;
});

// --- Form Submit Handler ---
var formId = cfg.formId || 'addProductForm';
document.getElementById(formId).addEventListener('submit', async function (e) {
    e.preventDefault();

    var startPriceId = cfg.startPriceId || 'startPrice';

    // Validate required fields
    var productName = document.getElementById('productName').value.trim();
    if (!productName) return showFieldError('productName', 'productNameError', 'Please enter a product name.');

    var category = document.getElementById('category').value;
    if (!category) return showFieldError('category', 'categoryError', 'Please select a category.');

    var startPrice = document.getElementById(startPriceId).value;
    if (!startPrice || isNaN(parsePrice(startPrice)) || parsePrice(startPrice) < 1000) {
        return showFieldError(startPriceId, 'startPriceError', 'Please enter a valid starting price (minimum 1,000 VND).');
    }

    var stepPrice = document.getElementById('stepPrice').value;
    if (!stepPrice || isNaN(parsePrice(stepPrice)) || parsePrice(stepPrice) < 1000) {
        return showFieldError('stepPrice', 'stepPriceError', 'Please enter a valid bid step (minimum 1,000 VND).');
    }

    var buyNowPrice = document.getElementById('buyNowPrice').value;
    if (buyNowPrice && (isNaN(parsePrice(buyNowPrice)) || parsePrice(buyNowPrice) <= parsePrice(startPrice))) {
        return showFieldError('buyNowPrice', 'buyNowPriceError', 'Buy now price must be greater than starting price.');
    }

    var endDateDisplay = document.getElementById('endDate').value;
    if (!endDateDisplay) return showFieldError('endDate', 'endDateError', 'Please select a valid end date and time.', true);

    if (new Date(endDateDisplay) <= new Date()) {
        return showFieldError('endDate', 'endDateError', 'End date and time must be in the future.', true);
    }

    // Update formatted end date
    document.getElementById('endDateFormatted').value = endDateDisplay.replace('T', ' ') + ':00';

    // Validate images
    if (!thumbnail) {
        document.getElementById('thumbnailError').style.display = 'block';
        document.getElementById('uppy-thumbnail').scrollIntoView({ behavior: 'smooth', block: 'center' });
        Swal.fire({ icon: 'error', title: 'Error', text: 'Please upload a main thumbnail image.', confirmButtonColor: '#72AEC8' });
        return;
    }
    document.getElementById('thumbnailError').style.display = 'none';

    if (subImgs.length < 3) {
        document.getElementById('subImagesError').style.display = 'block';
        document.getElementById('uppy-subimages').scrollIntoView({ behavior: 'smooth', block: 'center' });
        Swal.fire({ icon: 'error', title: 'Error', text: 'Please upload at least 3 additional images.', confirmButtonColor: '#72AEC8' });
        return;
    }
    document.getElementById('subImagesError').style.display = 'none';

    // Validate seller
    var seller = document.getElementById('seller').value;
    if (!seller) return showFieldError('seller', 'sellerError', 'Please select a seller for this product.');

    // Handle checkbox hidden inputs
    var autoExtendCb = document.getElementById('autoExtend');
    var allowBiddersCb = document.getElementById('allowNewBidders');
    if (autoExtendCb && autoExtendCb.checked) {
        var h1 = document.querySelector('input[name="auto_extend"][type="hidden"]');
        if (h1) h1.disabled = true;
    }
    if (allowBiddersCb && allowBiddersCb.checked) {
        var h2 = document.querySelector('input[name="allow_new_bidders"][type="hidden"]');
        if (h2) h2.disabled = true;
    }

    // Set description from Quill
    document.getElementById('descriptionInput').value = quill.root.innerHTML.trim();

    // Submit
    e.target.submit();
});
