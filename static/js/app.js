$(function () {

    var socket, secret, xhr;
    var $file = $('#file'),
        $modal = $('#modal'),
        $progress = $('#progress');

    function uploadFile(file) {
        if (!socket) {
            socket = io.connect();
            socket.on('secret', function (s) { secret = s; });
        }
        socket.emit('upload', file.name, file.size);
        socket.once('file id', function (fileId) {
            $('#fileid_display').text(fileId);
            $('.modal-body').hide();
            $('#waiting').show();
            $modal.modal('show');
            socket.once('start upload', function (id) {
                if (fileId != id)
                    return;
                $progress.css('width', '0%');
                $('.modal-body').hide();
                $('#transferring').show();
                xhr = $.ajax({
                    type: 'POST',
                    url: '/upload/' + fileId,
                    xhr: function () {
                        var xhr = $.ajaxSettings.xhr();
                        xhr.upload.addEventListener('progress', function (e) {
                            var progress = e.loaded * 100 / e.total;
                            $progress.css('width', progress + '%');
                        });
                        return xhr;
                    },
                    data: file,
                    processData: false,
                    headers: {'Transfer-Secret': secret},
                }).done(function () {
                    $('.modal-body').hide();
                    $('#success').show();
                    setTimeout(function () {
                        $('#modal').modal('hide');
                    }, 1000);
                }).fail(function (xhr, status, error) {
                    $('.modal-body').hide();
                    $('#error_info').text(error);
                    console.log(error);
                    $('#error').show();
                }).always(function () {
                    xhr = null;
                });
            });
        });
    }

    $.event.props.push('dataTransfer');
    $(document).on('dragenter', function (e) {
        e.preventDefault();
        if ($('#modal').is(':hidden'))
            $('#drop_file').addClass('in');
    }).on('dragover', function (e) {
        e.preventDefault();
    }).on('dragleave', function (e) {
        e.preventDefault();
        if ($(e.target).is('#drop_file'))
            $('#drop_file').removeClass('in');
    }).on('drop', function (e) {
        e.preventDefault();
        $('#drop_file').removeClass('in');
        if ($('#modal').is(':visible'))
            return;
        if (e.dataTransfer.files.length == 1)
            uploadFile(e.dataTransfer.files[0]);
    });

    $('#upload').click(function () {
        $file.click();
    });
    $file.change(function () {
        uploadFile($file[0].files[0]);
    });

    $modal.on('hide', function (evt) {
        if (xhr) {
            if (!confirm('Cancel upload?')) {
                evt.preventDefault();
                return;
            }
            xhr.abort();
            xhr = null;
        }
        socket.emit('cancel');
    });

    $('#fileid').val('');
    $('#fileid').keypress(function (e) {
        if (e.which == 13)
            $('#download').click();
    });
    $('#download').click(function () {
        var fileid = $('#fileid').val();
        if (!fileid) {
            alert('Please input File ID');
            return;
        }
        window.open('/download/' + fileid);
        $('#fileid').val('');
    });

});
