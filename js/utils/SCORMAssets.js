// SCORM Assets
// Contains the SCORM API wrapper as a string to avoid fetch errors during export

export const SCORM_API_CONTENT = `/**
 * SCORM 1.2 API Wrapper
 * This file provides communication between the content and the LMS (Moodle)
 */

var scormAPI = (function() {
    var API = null;
    var findAttempts = 0;
    var maxAttempts = 500;
    
    function findAPI(win) {
        findAttempts++;
        if (win.API != null) return win.API;
        if (win.parent != null && win.parent != win) return findAPI(win.parent);
        if (win.opener != null && typeof(win.opener) != "undefined") return findAPI(win.opener);
        return null;
    }
    
    function getAPI() {
        if (API == null) API = findAPI(window);
        return API;
    }
    
    function initialize() {
        var api = getAPI();
        if (api == null) {
            console.log("SCORM API not found - running in standalone mode");
            return false;
        }
        var result = api.LMSInitialize("");
        if (result == "true") {
            console.log("SCORM initialized successfully");
            var status = api.LMSGetValue("cmi.core.lesson_status");
            if (status == "not attempted" || status == "") {
                api.LMSSetValue("cmi.core.lesson_status", "incomplete");
            }
            return true;
        } else {
            console.error("SCORM initialization failed");
            return false;
        }
    }
    
    function finish() {
        var api = getAPI();
        if (api == null) return false;
        var result = api.LMSFinish("");
        return result == "true";
    }
    
    function getValue(element) {
        var api = getAPI();
        if (api == null) return "";
        return api.LMSGetValue(element);
    }
    
    function setValue(element, value) {
        var api = getAPI();
        if (api == null) return false;
        var result = api.LMSSetValue(element, value);
        return result == "true";
    }
    
    function commit() {
        var api = getAPI();
        if (api == null) return false;
        var result = api.LMSCommit("");
        return result == "true";
    }
    
    function setCompleted() {
        setValue("cmi.core.lesson_status", "completed");
        commit();
    }
    
    function setPassed() {
        setValue("cmi.core.lesson_status", "passed");
        commit();
    }
    
    function setFailed() {
        setValue("cmi.core.lesson_status", "failed");
        commit();
    }
    
    function setScore(score, min, max) {
        min = min || 0;
        max = max || 100;
        setValue("cmi.core.score.raw", score);
        setValue("cmi.core.score.min", min);
        setValue("cmi.core.score.max", max);
        commit();
    }
    
    function setSessionTime(totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
        var seconds = totalSeconds - (hours * 3600) - (minutes * 60);
        var timeString = padTime(hours) + ":" + padTime(minutes) + ":" + padTime(seconds);
        setValue("cmi.core.session_time", timeString);
        commit();
    }
    
    function padTime(num) {
        return (num < 10 ? "0" : "") + num;
    }
    
    function setSuspendData(data) {
        var dataString = typeof data === 'string' ? data : JSON.stringify(data);
        setValue("cmi.suspend_data", dataString);
        commit();
    }
    
    function getSuspendData() {
        var data = getValue("cmi.suspend_data");
        try {
            return data ? JSON.parse(data) : null;
        } catch(e) {
            return data;
        }
    }
    
    var startTime = new Date();
    
    function updateSessionTime() {
        var currentTime = new Date();
        var elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        setSessionTime(elapsedSeconds);
    }
    
    setInterval(updateSessionTime, 30000);
    
    return {
        initialize: initialize,
        finish: finish,
        getValue: getValue,
        setValue: setValue,
        commit: commit,
        setCompleted: setCompleted,
        setPassed: setPassed,
        setFailed: setFailed,
        setScore: setScore,
        setSessionTime: setSessionTime,
        setSuspendData: setSuspendData,
        getSuspendData: getSuspendData,
        updateSessionTime: updateSessionTime
    };
})();

window.addEventListener('load', function() {
    scormAPI.initialize();
});

window.addEventListener('beforeunload', function() {
    scormAPI.updateSessionTime();
    scormAPI.finish();
});

window.scormAPI = scormAPI;
`;
