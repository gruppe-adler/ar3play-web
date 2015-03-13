/*global $, _*/
(function () {

    var
        currentMission = null,
        speed = 1,
        currentTime = 0,
        timeChangeCallbacks = [],
        missionEndCallbacks = [],
        missionEnded = false;

    function changesUrl(missionname, from, to) {
        return dataUrl + '/mission/' + missionname + '/changes?from=' + from + '&to=' + to;
    }

    function loop() {
        if (!currentMission || speed <= 0 || missionEnded) {
            console.log('nothing to do');
            setTimeout(loop, 1000);
            return;
        }
        if (currentMission.endtime && currentTime >= currentMission.endtime) {
            console.log('mission ended');
            missionEnded = true;
            missionEndCallbacks.forEach(function (cb) { cb(); });
            setTimeout(loop, 1000);
            return;
        }

        var nextTime = currentTime + speed,
            url = changesUrl(currentMission.name, parseInt(currentTime, 10), parseInt(nextTime, 10));

        currentTime = nextTime;

        $.get(url, function (data) {

            map.updateMap(data);
            timeChangeCallbacks.forEach(function (cb) {
                cb(currentTime);
            });
        }).always(function () {
            setTimeout(loop, 1000);
        });
    }

    loop();

    function restart() {
        map.clearMap();
        if (!currentMission) {
            throw new Error('no mission selected');
        }
        currentTime = currentMission.starttime;
        missionEnded = false;

    }

    window.runner = {
        setMission: function (mission /*{name: string, starttime: number, endtime?: number}*/) {
            currentMission = mission;
            restart();
        },
        setSpeed: function (multiplicator) {
            if (multiplicator >= 1) {
                speed = parseInt(multiplicator, 10);
            } else {
                speed = multiplicator;
            }
        },
        restart: restart,
        onTimechange: function (cb) {
            timeChangeCallbacks.push(cb);
        },
        onMissionEnd: function (cb) {
            missionEndCallbacks.push(cb);
        }
    };
}());