$(function () {

    var socket, secret, xhr;
    var $file = $('#file'),
        $progress = $('#progress');

    $('#upload').click(function () {
        $file.click();
    });

    $file.change(function () {
        var file = $file[0].files[0];
        if (!socket) {
            socket = io.connect();
            socket.on('secret', function (s) { secret = s; });
        }
        socket.emit('upload', file.name, file.size);
        socket.once('file id', function (fileId) {
            $('#fileid_display').text(fileId);
            $('.modal-body').hide();
            $('#waiting').show();
            $('#modal').modal('show');
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
    });

    $('#modal').on('hide', function () {
        if (xhr) {
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
        window.open('/download/' + $('#fileid').val());
        $('#fileid').val('');
    });

});
