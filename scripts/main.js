var dataUrl = 'http://' + (document.location.host || 'localhost') + ':12302';


$(function () {

    var $time = $('#time');

    function getMission(name) {
        $.get(dataUrl + '/mission/' + name, function (data) {
            if (data) {
                if (data.is_streamable || data.endtime) {
                    data.name = name;
                    runner.setMission(data);
                } else {
                    $('#messages').html(name + ' nicht streambar');
                }
            } else {
                $('#messages').html(name + ' nicht gefunden');
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
        if (data && data.is_streamable) {
            runner.setMission(currentMission);
            runner.setSpeed(1);
        } else {
            console.log('huh, current mission not available or not streamable');
        }
    });

    $.get(dataUrl + '/missions', function (missions) {
        $('#mission-select').html(missions.map(function (mission) {
            return '<option value="' + mission + '" >' + mission + '</option>';
        }).join('\n'))
    });

    $('#mission-select').change(function () {
        getMission(this.value);
    });

    function sliderChange() {
        var sliderValue = this.value;
        var multiplicator = Math.min(100, Math.pow(sliderValue, 1.5));
        $('#play-multiplicator').text(multiplicator);
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