export function setupCompletionHandlers({
    t,
    showToast,
    storage,
    runtimeState,
    fetchTasksFromApi,
    prefetchTaskBatchImages,
    loadTask,
    uploadFeedbackToApi
}) {
    const shareInput = document.getElementById('share-link-input');

    const copyLinkBtn = document.getElementById('copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareInput.value);
                const originalText = copyLinkBtn.textContent;
                copyLinkBtn.textContent = t('completion.copiedBtn');
                copyLinkBtn.style.backgroundColor = '#4caf50';
                setTimeout(() => {
                    copyLinkBtn.textContent = originalText;
                    copyLinkBtn.style.backgroundColor = '';
                }, 2000);
            } catch (err) {
                if (shareInput) {
                    shareInput.select();
                    document.execCommand('copy');
                }
            }
        });
    }

    const moreTasksBtn = document.getElementById('more-tasks-btn');
    if (moreTasksBtn) {
        moreTasksBtn.addEventListener('click', async () => {
            if (storage.isCoolingDown()) {
                showToast(t('messages.noMoreTasks'));
                return;
            }

            moreTasksBtn.disabled = true;
            const originalText = moreTasksBtn.textContent;
            moreTasksBtn.textContent = t('messages.loadingTasks');

            const nextTasks = await fetchTasksFromApi();
            if (nextTasks && nextTasks.length > 0) {
                runtimeState.taskList = [...runtimeState.taskList, ...nextTasks];
                runtimeState.tasksLoaded = true;
                prefetchTaskBatchImages(nextTasks);
                loadTask(runtimeState.currentTaskIndex + 1);
            } else {
                storage.setCooldown();
                showToast(t('messages.noMoreTasks'), 6000);
                moreTasksBtn.disabled = false;
                moreTasksBtn.textContent = originalText;
            }
        });
    }

    const feedbackCard = document.getElementById('feedback-card');
    const feedbackInput = document.getElementById('feedback-input');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    if (feedbackInput && submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', async () => {
            const feedbackText = feedbackInput.value.trim();
            if (!feedbackText) {
                showToast(t('completion.feedbackEmptyToast'));
                return;
            }

            const uploaded = await uploadFeedbackToApi(feedbackText);
            if (uploaded) {
                feedbackCard.style = 'display: none !important;';
                showToast(t('completion.feedbackSentBtn'));
            } else {
                showToast(t('completion.feedbackFailedToast'));
            }
        });
    }
}
