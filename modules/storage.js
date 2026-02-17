import { COOLDOWN } from './constants.js';

export class GlobalStorage {
    constructor() {
        this.results = JSON.parse(localStorage.getItem('suite_results') || '[]');
        this.listeners = [];
        this._groupIdentifier = null;
        this._userUuid = null;
    }

    getGroupIdentifier() {
        if (!this._groupIdentifier) {
            this._groupIdentifier = localStorage.getItem("groupIdentifier") || (() => {
                const urlParams = new URLSearchParams(window.location.search);
                const group = urlParams.get('group');
                if (group) {
                    localStorage.setItem("groupIdentifier", group);
                }
                return group;
            })();
        }

        return this._groupIdentifier;
    }

    getUserUuid() {
        if (!this._userUuid) {
            let uuid = localStorage.getItem("userUuid");
            if (!uuid) {
                uuid = crypto.randomUUID ? crypto.randomUUID() : this._generateSimpleUuid();
                localStorage.setItem("userUuid", uuid);
            }
            this._userUuid = uuid;
        }
        return this._userUuid;
    }

    _generateSimpleUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    saveResult(taskId, taskType, data, assets = null, startTime = null, isDummy = false) {
        const entry = {
            taskId,
            taskType,
            timestamp: new Date().toISOString(),
            groupIdentifier: this.getGroupIdentifier(),
            userUuid: this.getUserUuid(),
            assets,
            data,
            isDummy
        };
        
        // Add time taken if start time was provided
        if (startTime !== null) {
            entry.timeTakenMs = Date.now() - startTime;
        }
        this.results.push(entry);
        this.persist();
        this.notify();

        // Dispatch event for sequencer
        window.dispatchEvent(new CustomEvent('task-completed', { detail: { taskType } }));
    }

    clear() {
        this.results = [];
        this.persist();
        this.notify();
    }

    downloadResults() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.results, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "suite_results.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    persist() {
        localStorage.setItem('suite_results', JSON.stringify(this.results));
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.results);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.results));
    }

    getResults() {
        return this.results;
    }

    hasVisited() {
        return localStorage.getItem('hasVisited') === 'true';
    }

    markVisited() {
        localStorage.setItem('hasVisited', 'true');
    }

    isCoolingDown() {
        const cooldownKey = 'tasks_cooldown_timestamp';
        const cooldownDuration = COOLDOWN.TASK_FETCH;
        const cooldownStart = localStorage.getItem(cooldownKey);
        if (!cooldownStart) return false;

        const elapsed = Date.now() - parseInt(cooldownStart, 10);
        if (elapsed >= cooldownDuration) {
            localStorage.removeItem(cooldownKey);
            return false;
        }
        return true;
    }

    setCooldown() {
        const cooldownKey = 'tasks_cooldown_timestamp';
        localStorage.setItem(cooldownKey, Date.now().toString());
    }
}

export const storage = new GlobalStorage();
