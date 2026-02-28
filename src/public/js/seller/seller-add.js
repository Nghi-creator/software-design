/**
 * Seller Product Add Module
 * Handles Uppy, Cleave.js, Quill, and Validation for the Add Product form
 */

window.SellerAdd = (function ($, Uppy, Dashboard, XHRUpload) {
    let quill;
    let thumbnail = '';
    let subImgs = [];

    /**
     * Initialize Uppy for Main Thumbnail
     */
    function initUppyThumbnail() {
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
            endpoint: '/seller/products/upload-thumbnail',
            fieldName: 'thumbnail',
            formData: true
        });

        uppyThumbnail.on('file-added', (file) => {
            $('#thumbnailError').hide();
        });

        uppyThumbnail.on('upload-success', (file, response) => {
            if (response.body.file) {
                thumbnail = response.body.file.filename;
                $('#txt_thumbnail').val(thumbnail);
            }
        });
    }

    /**
     * Initialize Uppy for Sub Images
     */
    function initUppySubImages() {
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
            endpoint: '/seller/products/upload-subimages',
            fieldName: 'images',
            formData: true
        });

        uppySubImages.on('file-added', (file) => {
            $('#subImagesError').hide();
        });

        uppySubImages.on('upload-success', (file, response) => {
            if (response.body.files) {
                response.body.files.forEach(f => {
                    subImgs.push(f.filename);
                });
                $('#txt_imgs_list').val(JSON.stringify(subImgs));
            }
        });
    }

    /**
     * Initialize Cleave.js for Price Formatting
     */
    function initCleave() {
        ['#startPrice', '#stepPrice', '#buyNowPrice'].forEach(selector => {
            if ($(selector).length) {
                new Cleave(selector, {
                    numeral: true,
                    numeralThousandsGroupStyle: 'thousand'
                });
            }
        });
    }

    /**
     * Initialize Quill for Main Description
     */
    function initQuill() {
        quill = new Quill('#editor-container', {
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
    }

    /**
     * Form Validation and Submission
     */
    function initValidation() {
        const $form = $('#addProductForm');

        // Reset error on input
        $form.on('input change', 'input, select, textarea', function () {
            $(this).removeClass('is-invalid');
            const errorId = $(this).attr('id') + 'Error';
            $('#' + errorId).removeClass('d-block').hide();
        });

        // Set initial UTC timestamp
        $('#createdAt').val(new Date().toISOString());

        // Handle End Date conversion
        $('#endDate').on('change', function () {
            if (this.value) {
                const localDate = new Date(this.value);
                $('#endDateFormatted').val(localDate.toISOString());
            }
        });

        $form.on('submit', function (e) {
            e.preventDefault();

            // Update quill content to hidden input
            $('#descriptionInput').val(quill.root.innerHTML.trim());

            const formData = {
                name: $('#productName').val().trim(),
                category: $('#category').val(),
                startPrice: $('#startPrice').val().replace(/,/g, ''),
                stepPrice: $('#stepPrice').val().replace(/,/g, ''),
                buyNowPrice: $('#buyNowPrice').val().replace(/,/g, ''),
                endDate: $('#endDate').val(),
                thumbnail: $('#txt_thumbnail').val(),
                subImgs: subImgs.length
            };

            // Validation logic
            if (!formData.name) return showError('#productName', 'Please enter a product name.');
            if (!formData.category) return showError('#category', 'Please select a category.');
            if (!formData.startPrice || isNaN(formData.startPrice) || parseInt(formData.startPrice) < 1000)
                return showError('#startPrice', 'Please enter a valid starting price (min 1,000 VND).');
            if (!formData.stepPrice || isNaN(formData.stepPrice) || parseInt(formData.stepPrice) < 1000)
                return showError('#stepPrice', 'Please enter a valid bid step (min 1,000 VND).');
            if (formData.buyNowPrice && parseInt(formData.buyNowPrice) <= parseInt(formData.startPrice))
                return showError('#buyNowPrice', 'Buy now price must be greater than starting price.');
            if (!formData.endDate) return showError('#endDate', 'Please select a valid end date and time.');

            const endDateTime = new Date(formData.endDate);
            if (endDateTime <= new Date()) return showError('#endDate', 'End date and time must be in the future.');

            if (!formData.thumbnail) {
                $('#thumbnailError').show();
                scrollTo('#uppy-thumbnail');
                Swal.fire({ icon: 'error', title: 'Error', text: 'Please upload a main thumbnail.' });
                return;
            }

            if (formData.subImgs < 3) {
                $('#subImagesError').show();
                scrollTo('#uppy-subimages');
                Swal.fire({ icon: 'error', title: 'Error', text: 'Please upload at least 3 additional images.' });
                return;
            }

            // Sync checkboxes
            if ($('#autoExtend').is(':checked')) $('input[name="auto_extend"][type="hidden"]').prop('disabled', true);
            if ($('#allowNewBidders').is(':checked')) $('input[name="allow_new_bidders"][type="hidden"]').prop('disabled', true);

            // Final submit
            this.submit();
        });
    }

    function showError(selector, message) {
        const $el = $(selector);
        $el.addClass('is-invalid');
        const errorId = $el.attr('id') + 'Error';
        $('#' + errorId).addClass('d-block').text(message).show();
        scrollTo($el);
        $el.focus();
        Swal.fire({ icon: 'error', title: 'Validation Error', text: message, confirmButtonColor: '#72AEC8' });
        return false;
    }

    function scrollTo($el) {
        $([document.documentElement, document.body]).animate({
            scrollTop: $($el).offset().top - 100
        }, 500);
    }

    /**
     * Initialize Module
     */
    function init() {
        initUppyThumbnail();
        initUppySubImages();
        initCleave();
        initQuill();
        initValidation();
    }

    return {
        init
    };
})(jQuery, Uppy, Dashboard, XHRUpload);
