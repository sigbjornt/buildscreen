BuildScreenUpdater = function() {
    window.sounds = {};

    this.goLoud = function(goLoud) {
        window.sounds.goLoud = goLoud;
        return this;
    };

    this.talkAboutBuilds = function(talk) {
        window.sounds.talk = talk;
        return this;
    };

    this.playOnSuccess = function(successSound) {
        window.sounds["STABLE"] = new buzz.sound(successSound);
        return this;
    };

    this.playOnOneLessFailure = function(oneLessFailureSound) {
        window.sounds["ONE_DOWN"] = new buzz.sound(oneLessFailureSound);
        return this;
    };

    this.playOnFailure = function(failureSound) {
        window.sounds["FAILED"] = new buzz.sound(failureSound);
        return this;
    };

    this.playOnExtremeFailure = function(failureSound) {
        window.sounds["EXTREME"] = new buzz.sound(failureSound);
        return this;
    };

    this.playOnUnstable = function(unstableSound) {
        window.sounds["UNSTABLE"] = new buzz.sound(unstableSound);
        return this;
    };


    this.everySeconds = function(updateIntevalInSeconds) {
        this.updateIntevalInSeconds = updateIntevalInSeconds;
        if (!this.intervalHandle) {
            clearInterval(this.intervalHandle);
        }
        this.intervalHandle = setInterval(function(mySelf) {
            mySelf.update();
        }, this.updateIntevalInSeconds * 1000, this);
        return this;
    };

    this.update = function() {
        new Ajax.Request(window.location.href + "statusApi/api/json", {
            method: "get",
            onSuccess: function(response) {
                if(response.status === 200) {
                    $("disconnectedOverlay").removeClassName("disconnected");
                    new ViewUpdater(eval("(" + response.responseText + ")")).updateStatus();
                }
                if(response.status === 0) {
                    $("disconnectedOverlay").addClassName("disconnected");
                }
            },
            onFailure: function(response) {
                console.log(response.status + ": " + response.statusText);
            }
        });
    };
};

ViewUpdater = function(updateStatus) {
    this.newBuildScreenStatus = updateStatus;

    this.updateStatus = function() {
        if(window.activeBuildScreenStatus) {
            $("mainDisplay").removeClassName(window.activeBuildScreenStatus.status);
            if(window.sounds.goLoud === true) {
                var sound = findSoundToPlay(this.newBuildScreenStatus, window.activeBuildScreenStatus);
                if(sound) {
                    /*sound.play()/*.bind("ended", function() {
                     meSpeak.speak('list new culprits here...');
                     })*/;
                }
            }
        }

        $("mainDisplay").addClassName(this.newBuildScreenStatus.status);
        $("status").update(this.newBuildScreenStatus.status === 'STABLE' ? "It's awesometime" : "Jenkins is failing");
        if(this.newBuildScreenStatus.status === 'FAILED' || this.newBuildScreenStatus.status === 'UNSTABLE') {
            var result;
            dust.render("failedBuilds", this.newBuildScreenStatus, function(err, res) {
                if (err) {
                    console.error(err);
                }
                result = res;
            });
            $("failedBuilds").update(result);
        }
        window.activeBuildScreenStatus = this.newBuildScreenStatus;
    };

    var talkAboutBuilds = function(newStatus, activeStatus) {

    }
    var findSoundToPlay = function(newStatus, activeStatus) {
        if(newStatus.status !== activeStatus.status && newStatus.status === "STABLE") {
            return window.sounds["STABLE"];
        }
        var currentlyFailingJobs = newStatus.failedJobs;
        var currentlyUnstableJobs = newStatus.unstableJobs;
        var currentlyNonhealthyJobs = currentlyFailingJobs.concat(currentlyUnstableJobs);

        var previouslyFailedJobs = activeStatus.failedJobs;
        var previouslyUnstableJobs = activeStatus.unstableJobs;
        var previouslyNonHealthyJobs = previouslyFailedJobs.concat(previouslyUnstableJobs);

        if(hasMoreItems(currentlyFailingJobs, previouslyFailedJobs)) {
            mentionFailingJobs(newItemsIn(currentlyFailingJobs,previouslyFailedJobs))
            return window.sounds["FAILED"];
        } else if (hasMoreItems(currentlyUnstableJobs, previouslyUnstableJobs)) {
            mentionUnstableJobs(newItemsIn(currentlyUnstableJobs,previouslyUnstableJobs));
            return window.sounds["UNSTABLE"];
        } else {
            if (hasMoreItems(previouslyNonHealthyJobs, currentlyNonhealthyJobs)) {
                mentionFixedJobs(newItemsIn(previouslyNonHealthyJobs,currentlyNonhealthyJobs))
                return window.sounds["ONE_DOWN"];
            }
        }
//		else {
//			window.sounds[this.newBuildScreenStatus.status];
//		}

//
//		var newStatusFailedJobs = toMap(newStatus.failedJobs);
//		activeStatus.failedJobs.forEach(function(activeFailure) {
//			if(!newStatusFailedJobs[activeFailure.name] ) {
//				;
//			}
//		});
//		if(does(newStatus).haveElementsNotIn(activeStatus))
    };

    var hasMoreItems = function(newFailures, activeFailures) {
        var activeFailedJobs = toMap(activeFailures);
        for (var i = 0; i < newFailures.length; ++i) {
            if(!activeFailedJobs[newFailures[i].name]) {
                return true;
            }
        }
        return false;
    };

    var newItemsIn = function(newFailures, activeFailures) {
        var newItems = []
        var activeFailedJobs = toMap(activeFailures);
        for (var i = 0; i < newFailures.length; ++i) {
            var itemName = newFailures[i].name;
            if(!activeFailedJobs[ itemName]) {
                newItems.push(itemName);
            }
        }
        return newItems;
    }

    var mentionFailingJobs = function(jobNames) {
        say("New failing jobs:")
        sayAll(jobNames);
    }
    var mentionUnstableJobs = function(jobNames) {
        say("New unstable jobs:")
        sayAll(jobNames);

    }
    var mentionFixedJobs = function(jobNames) {
        say("Fixed jobs:")
        sayAll(jobNames);
    }

    var say = function(text) {
        if('speechSynthesis' in window && window.sounds.talk){
            var msg = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(msg);
        }
    }

    var sayAll = function(textList){
        textList.forEach(function(text){
            say(text);
        });
    }

    var toMap = function(jobArray) {
        var map = {};
        for (var i = 0; i < jobArray.length; ++i)
            map[jobArray[i].name] = jobArray[i];
        return map;
    };
};