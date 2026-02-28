/**
 * Admin System Settings — Validation & Confirmation
 * Dependencies: jQuery ($), SweetAlert2 (Swal)
 */

$(document).ready(function () {
    // Settings fields config — add new settings here
    var settingsFields = [
        { id: 'txtNewProductLimit', label: 'New Product Limit' },
        { id: 'txtAutoExtendTrigger', label: 'Auto Extend Trigger' },
        { id: 'txtAutoExtendDuration', label: 'Auto Extend Duration' }
    ];

    $('#formSystemSettings').on('submit', function (e) {
        e.preventDefault();
        var form = this;
        var values = {};

        // Validate all fields
        for (var i = 0; i < settingsFields.length; i++) {
            var f = settingsFields[i];
            var val = parseInt($('#' + f.id).val());
            if (!val || val < 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    text: f.label + ' must be greater than 0!'
                });
                return false;
            }
            values[f.label] = val;
        }

        // Build confirmation HTML
        var html = '<div class="text-start">';
        for (var key in values) {
            html += '<p class="mb-2"><strong>' + key + ':</strong> ' + values[key] + ' minutes</p>';
        }
        html += '</div>';

        // Confirm before saving
        Swal.fire({
            title: 'Confirm Changes',
            html: html,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, save settings!'
        }).then(function (result) {
            if (result.isConfirmed) {
                form.submit();
            }
        });
    });
});
