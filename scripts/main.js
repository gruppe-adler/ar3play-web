var dataUrl = 'http://' + (document.location.host || 'localhost') + ':12302';


$(function () {

    var
        $time = $('#time'),
        log = function (message) {
            $('#messages').html(message).fadeTo(1000, 0.1);
        },
        currentServerMission = '';

    function getMission(name) {
        $.get(dataUrl + '/mission/' + name, function (data) {
            if (data) {
                if (data.is_streamable || data.endtime) {
                    data.name = name;
                    runner.setMission(data);
                    $('#playing-mission-starttime').text(timestampToIsodate(data.starttime));
                } else {
                    log(name + ' nicht streambar');
                }
            } else {
                log(name + ' nicht gefunden');
            }
        });
    }

    map.init();


    $('#toggle-names').click((function () {
        var isOpen = false;
        return function () {
            map[isOpen ? 'hideMarkers' : 'showMarkers']();
            isOpen = !isOpen;
        };
    }()));

    $.get(dataUrl + '/currentMission', function (currentMission) {
        currentServerMission = currentMission;

        $.get(dataUrl + '/missions', function (missions) {
            $('#mission-select').html('<option value="">---</option>\n' + missions.map(function (mission) {
                var bits = parseMissionInstanceName(mission);

                return '<option value="' + mission + '" >' +
                    timestampToIsodate(bits.starttime) + ' : ' + bits.name +
                    (currentServerMission === mission ? ' LÄUFT' : '') +
                    '</option>';
            }).join('\n'))
        });

    });


    function parseMissionInstanceName(missionInstanceName) {
        var bits = missionInstanceName.split('-');

        return {
            starttime: parseInt(bits[0], 10),
            name: bits.slice(1).join('-')
        }
    }

    function timestampToIsodate(ts) {
        return (new Date(ts * 1000)).toISOString();
    }


    $('#mission-select').change(function () {
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
        var date = new Date(time * 1000);

        $time.text(date.toISOString());
    });

    runner.onMissionEnd(function () {
        runner.setSpeed(0);
        $('#play-multiplicator').text(0);
        $('#mission-play-speed')[0].value = 0;
        $time.text($time.text() + ' ENDE');
    });

});