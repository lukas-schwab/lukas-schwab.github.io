export async function fetchTasksFromApi(storage, setUserProgress) {
    if (storage.isCoolingDown()) return [];

    const userId = storage.getUserUuid();
    const url = `https://europe-west3-concept-interpretability-efded.cloudfunctions.net/get_tasks_batch?userId=${userId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Handle both old array format and new object format
        let tasks = [];
        if (data.tasks && Array.isArray(data.tasks)) {
            setUserProgress(data.userProgress || null);
            tasks = data.tasks;
        } else if (data.fullSequence) {
            // New format with metadata
            setUserProgress(data);
            tasks = data.tasks || [];
        } else {
            tasks = Array.isArray(data) ? data : [];
        }

        return tasks;
    } catch (error) {
        console.error('Could not fetch tasks:', error);
        return [];
    }
}

export async function uploadResultsToApi(storage) {
    const allResults = storage.getResults();
    // Filter out dummy tasks before uploading
    const results = allResults.filter(result => !result.isDummy);
    if (results.length === 0) return true;

    const url = 'https://europe-west3-concept-interpretability-efded.cloudfunctions.net/submit_results_batch';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
        });

        if (!response.ok) {
            throw new Error(`Upload failed! status: ${response.status}`);
        }

        // Clear local storage after successful upload of this batch
        storage.clear();
        return true;
    } catch (error) {
        console.error('Could not upload batch results:', error);
        return false;
    }
}
