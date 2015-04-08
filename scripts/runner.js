/*global $, _*/
(function () {

    var
        currentMission = null,
        speed = 1,
        currentTime = 0,
        timeChangeCallbacks = [],
        missionEndCallbacks = [],
        missionEnded = false,
        knownUnits = {};

    function changesUrl(instanceId, from, to) {
        return dataUrl + '/mission/' + encodeURIComponent(instanceId) + '/changes?from=' + from + '&to=' + to;
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
            url = changesUrl(currentMission.instanceId, parseInt(currentTime, 10), parseInt(nextTime, 10));

        currentTime = nextTime;

        $.get(url, function (data) {

            _.each(data, function (newData, id) {
                knownUnits[id] = knownUnits[id] || newData;

                Object.keys(newData).forEach(function (key) {
                    if (newData[key] !== null) {
                        knownUnits[id][key] = newData[key];
                    }
                });
            });

            map.updateMap(knownUnits);
            timeChangeCallbacks.forEach(function (cb) {
                cb(currentTime);
            });
        }).always(function () {
            setTimeout(loop, 2000);
        });
    }

    loop();

    function restart() {
        if (!currentMission) {
            throw new Error('no mission selected');
        }
        clear();
        currentTime = currentMission.starttime;
        missionEnded = false;
    }

    function clear() {
        map.clearMap();
        knownUnits = {};
    }

    window.runner = {

        setMission: function (mission /*{name: string, starttime: number, endtime?: number}*/) {
            currentMission = mission;
            if (mission) {
                restart();
            } else {
                clear();
            }
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