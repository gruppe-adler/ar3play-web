if (!window.dataSources) {
    alert('missing config.js with dataSources definition!');
}
var dataUrl = localStorage.getItem('api-url') || _.map(dataSources)[0] || 'http://' + (document.location.host || 'localhost') + ':12302';

function getQuery() {
    var query = {};
    document.location.search.substr(1).split('&').forEach(function (part) {
        var bits = part.split('=');
        var name = decodeURIComponent(bits[0]), value;
        if (bits[1]) {
            value = decodeURIComponent(bits[1]);
        }
        query[name] = value;
    });
    return query;
}


$(function () {

    var
        query = getQuery(),
        world = query.world || 'stratis',
        missions = {},
        dateFormatFunctions = {
            iso8601: function (date) {
                return date.toISOString();
            },
            locale: function (date) {
                return date.toLocaleString();
            }
        },
        dateFormat = localStorage.getItem('date-format') || 'iso8601',
        $time = $('#time'),
        log = function (message) {
            $('#messages').html(message).fadeTo(1000, 0.1);
        },
        $missionSelect = $('#mission-select'),
        $missionDelete = $('#mission-delete'),
        currentServerMission = '',
        currentPlayingInstanceId = '';

    function timeFormat(ts) {
        return typeof ts === 'number' ? dateFormatFunctions[dateFormat](new Date(ts * 1000)) : '';
    }

    function getMission(instanceId) {
        var mission = missions[instanceId];
        if (mission) {
            if (mission.worldname.toLowerCase() !== world) {
                return changeWorld(mission.worldname);
            }
            if (mission.is_streamable || mission.endtime) {
                currentPlayingInstanceId = instanceId;
                runner.setMission(mission);
                $('#playing-mission-starttime').text(timeFormat(mission.starttime));
                $('#playing-mission-title').text(missions[instanceId].name);
                $('#playing-mission-endtime').text(timeFormat(mission.endtime));
            } else {
                log(instanceId + ' nicht streambar');
            }
        } else {
            log(instanceId + ' nicht gefunden');
        }

    }


    try {
        map.init(world);
    } catch (e) {
        window.console && console.error(e);
    }

    function changeWorld(world) {
        document.location.href = document.location.href.split('?')[0] + '?world=' + world.toLowerCase();
        $('#world-select').text(world);
    }

    $('#show-names').click(function () {
        this.checked ? map.showMarkers() : map.hideMarkers();
    });

    $.get(dataUrl + '/currentMission').done(function (currentMission) {
        currentServerMission = currentMission;

        $.get(dataUrl + '/missions', function (data) {
            data = data.filter(function (mission) {
                if (mission) {
                    return true;
                }
                window.console && console.log('empty mission data :(');
                return false;
            });
            $missionSelect.html('<option value="">---</option>\n' + data.map(function (mission) {
                missions[mission.instanceId] = mission;
                return '<option value="' + mission.instanceId + '">' +
                    timeFormat(mission.starttime) + ' : ' + mission.name +
                    ' (' + mission.worldname + ')' +
                    (currentServerMission === mission ? ' LÄUFT' : '') +
                    '</option>';
            }).join('\n'))
        });

    }).fail(function () {
        console.log(arguments);
    });

    $missionSelect.change(function () {
        getMission(this.value);
    });

    function sliderChange() {
        var sliderValue = this.value;
        var multiplicator = Math.min(100, Math.pow(sliderValue, 1.5));
        $('#play-multiplicator').text(multiplicator.toFixed(1));
        runner.setSpeed(multiplicator);
    }

    $('#mission-play-speed').change(sliderChange).on('input', sliderChange);

    $('#mission-restart').click(runner.restart);

    runner.onTimechange(function (time) {
        $time.text(timeFormat(time));
    });

    runner.onMissionEnd(function () {
        runner.setSpeed(0);
        $('#play-multiplicator').text(0);
        $('#mission-play-speed')[0].value = 0;
        $time.text($time.text() + ' ENDE');
    });

    $('#select-date-format').change(function () {
        localStorage.setItem('date-format', this.value);
        dateFormat = this.value;
    })[0].value = dateFormat;

    $('#select-api-url').html(_.map(dataSources, function (val, name) {
        return '<option value="' + val + '">' + name + '</option>';
    }).join('\n')).change(function () {
        localStorage.setItem('api-url', this.value);
        document.location.reload();
    })[0].value = dataUrl;

    (function () {
        var
            $authenticationInput = $('#authentification'),
            auth = localStorage.getItem('adlertools-secret');

        function updateControls() {
            if (auth) {
                $missionDelete.fadeIn();
            } else {
                $missionDelete.fadeOut();
            }
        }

        $authenticationInput.change(function () {
            auth = this.value;
            localStorage.setItem('adlertools-secret', auth);
            updateControls();
        });

        $(document).ajaxSend(function (event, jqXhr) {
            jqXhr.setRequestHeader('Authentication', localStorage.getItem('adlertools-secret'));
        });

        $authenticationInput.val(auth);
        updateControls()

    }());

    $missionDelete.click(function () {
        $.ajax(dataUrl + '/mission/' + currentPlayingInstanceId, {
            method: 'DELETE'
        }).done(function () {
            $missionSelect.find('[value=""]').select();
            $missionSelect.find('[value="' + currentPlayingInstanceId + '"]').remove();
        }).fail(function (jqXhr) {
            alert('failed to delete ' + currentPlayingInstanceId + ': ' + (jqXhr.responseText || jqXhr.statusText));
        });
    });

});
