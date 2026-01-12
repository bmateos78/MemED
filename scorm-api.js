/**
 * SCORM 1.2 API Wrapper
 * This file provides communication between the content and the LMS (Moodle)
 */

// SCORM API Wrapper
var scormAPI = (function() {
    var API = null;
    var findAttempts = 0;
    var maxAttempts = 500;
    
    // Find the SCORM API
    function findAPI(win) {
        findAttempts++;
        
        if (win.API != null) {
            return win.API;
        }
        
        if (win.parent != null && win.parent != win) {
            return findAPI(win.parent);
        }
        
        if (win.opener != null && typeof(win.opener) != "undefined") {
            return findAPI(win.opener);
        }
        
        return null;
    }
    
    // Get the API
    function getAPI() {
        if (API == null) {
            API = findAPI(window);
        }
        return API;
    }
    
    // Initialize SCORM
    function initialize() {
        var api = getAPI();
        if (api == null) {
            console.log("SCORM API not found - running in standalone mode");
            return false;
        }
        
        var result = api.LMSInitialize("");
        if (result == "true") {
            console.log("SCORM initialized successfully");
            
            // Set initial status if not already set
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
    
    // Finish SCORM session
    function finish() {
        var api = getAPI();
        if (api == null) {
            return false;
        }
        
        var result = api.LMSFinish("");
        return result == "true";
    }
    
    // Get a value from the LMS
    function getValue(element) {
        var api = getAPI();
        if (api == null) {
            return "";
        }
        
        return api.LMSGetValue(element);
    }
    
    // Set a value in the LMS
    function setValue(element, value) {
        var api = getAPI();
        if (api == null) {
            return false;
        }
        
        var result = api.LMSSetValue(element, value);
        return result == "true";
    }
    
    // Commit data to the LMS
    function commit() {
        var api = getAPI();
        if (api == null) {
            return false;
        }
        
        var result = api.LMSCommit("");
        return result == "true";
    }
    
    // Set completion status
    function setCompleted() {
        setValue("cmi.core.lesson_status", "completed");
        commit();
    }
    
    // Set passed status
    function setPassed() {
        setValue("cmi.core.lesson_status", "passed");
        commit();
    }
    
    // Set failed status
    function setFailed() {
        setValue("cmi.core.lesson_status", "failed");
        commit();
    }
    
    // Set score
    function setScore(score, min, max) {
        min = min || 0;
        max = max || 100;
        
        setValue("cmi.core.score.raw", score);
        setValue("cmi.core.score.min", min);
        setValue("cmi.core.score.max", max);
        commit();
    }
    
    // Set session time
    function setSessionTime(totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
        var seconds = totalSeconds - (hours * 3600) - (minutes * 60);
        
        var timeString = padTime(hours) + ":" + padTime(minutes) + ":" + padTime(seconds);
        setValue("cmi.core.session_time", timeString);
    }
    
    function padTime(num) {
        return (num < 10 ? "0" : "") + num;
    }
    
    // Save suspend data (for saving progress)
    function setSuspendData(data) {
        var dataString = typeof data === 'string' ? data : JSON.stringify(data);
        setValue("cmi.suspend_data", dataString);
        commit();
    }
    
    // Get suspend data (for restoring progress)
    function getSuspendData() {
        var data = getValue("cmi.suspend_data");
        try {
            return data ? JSON.parse(data) : null;
        } catch(e) {
            return data;
        }
    }
    
    // Track time spent
    var startTime = new Date();
    
    function updateSessionTime() {
        var currentTime = new Date();
        var elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        setSessionTime(elapsedSeconds);
        commit();
    }
    
    // Auto-update session time every 30 seconds
    setInterval(updateSessionTime, 30000);
    
    // Public API
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

// Initialize SCORM when the page loads
window.addEventListener('load', function() {
    scormAPI.initialize();
});

// Finish SCORM when the page unloads
window.addEventListener('beforeunload', function() {
    scormAPI.updateSessionTime();
    scormAPI.finish();
});

// Make scormAPI available globally
window.scormAPI = scormAPI;
