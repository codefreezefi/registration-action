const core = require('@actions/core');
const github = require('@actions/github');

try {
    const context = github.context;
    const payload = context.payload;

    // Get the JSON webhook payload for the event that triggered the workflow
    console.log(`The event payload: ${JSON.stringify(payload, undefined, 2)}`);

    if (payload.action !== 'opened') {
        core.debug('No issue was opened, skipping');
        return;
    }

    if (!payload.issue) {
        core.debug(
            'The event that triggered this action was not an issue, skipping.'
        );
        return;
    }

    const { title, body, labels } = payload.issue;

    console.log('title', title)
    console.log('body', body)
    console.log('labels', JSON.stringify(labels, undefined, 2))
} catch (error) {
    core.setFailed(error.message);
}