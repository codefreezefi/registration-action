const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')
const os = require('fs')
const { execSync } = require('child_process')

const exec = cmd => {
    console.log('Running: ', cmd)
    const res = execSync(cmd, { cwd: process.cwd() })
    console.log('Result:', res.toString())
}

try {
    const context = github.context;
    const payload = context.payload;

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

    const { number, title, body } = payload.issue;

    if (!title.startsWith('Registration')) {
        core.debug(
            'The issue title does not start with "Registration", skipping.'
        );
        return;
    }

    console.log('title', title)
    console.log('body', body)
    const { name, pronouns, image, ActivityPub, linkedin, link } = JSON.parse(body.match(/\`\`\`json([^\`]+)```/m)[1])
    if (!name) {
        throw new Error(`Registration issue #${number} has not name!`)
    }

    const data = {
        name,
        ...(pronouns ? { pronouns } : {}),
        ...(image ? { image } : {}),
        ...(ActivityPub ? { mastodon: ActivityPub } : {}),
        ...(linkedin ? { linkedin } : {}),
        ...(link ? { link } : {}),
    }
    //
    console.log('cwd', process.cwd())
    const outfile = `${process.cwd()}/_participants/${name.replace(/\s/g, '')}.md`
    fs.writeFileSync(
        outfile,
        [
            '---',
            Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n'),
            '---',
        ].join('\n'),
        'utf-8'
    )
    console.log(`${outfile} written ...`)
    exec(`cat ${outfile}`)
    exec(`git add ${outfile}`)
    exec(`git checkout -b registration-${number}`)
    exec(`git commit -m "Registration for ${name}"`)
    exec(`git push -u origin registration-${number}`)
    const octokit = new github.GitHub(process.env.GITHUB_TOKEN);
    console.log('Creating PR')
    octokit.pulls
        .create({
            base: 'gh-pages',
            head: `registration-${number}`,
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            title: `Registration for ${name}`,
            body: `This pull-request was created automatically for #${number}.`,
            maintainer_can_modify: true,
        })
        .then(pr => {
            console.log(`PR ${pr.data.id} created!`)
        })
        .catch(error => {
            core.setFailed(error.message)
        })
} catch (error) {
    core.setFailed(error.message);
}
