import * as github from '@actions/github';
import * as axios from 'axios';
import { Status } from './status';

const statusColorPalette: { [key in Status]: string } = {
  success: '#2CBE4E',
  cancelled: '#FFC107',
  failure: '#FF0000'
};

const statusText: { [key in Status]: string } = {
  success: 'Succeeded',
  cancelled: 'Cancelled',
  failure: 'Failed'
};

const textButton = (text: string, url: string) => ({
  textButton: {
    text,
    onClick: { openLink: { url } }
  }
});

export async function notify (name: string, url: string, status: Status): Promise<void> {
  const { owner, repo } = github.context.repo;
  const { eventName, sha, ref, payload } = github.context;
  const { number } = github.context.issue;
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const eventPath = eventName === 'pull_request' ? `/pull/${number}` : `/commit/${sha}`;
  const eventUrl = `${repoUrl}${eventPath}`;
  const checksUrl = `${repoUrl}${eventPath}/checks`;
  const body: any = {
    cards: [{
      sections: [
        {
          widgets: [{
            textParagraph: {
              text: `<b>${name} <font color="${statusColorPalette[status]}">${statusText[status]}</font></b>`
            }
          }]
        },
        {
          widgets: [
            {
              keyValue: {
                topLabel: 'repository',
                content: `${owner}/${repo}`,
                contentMultiline: true,
                button: textButton('OPEN REPOSITORY', repoUrl)
              }
            },
            {
              keyValue: {
                topLabel: 'event name',
                content: eventName,
                button: textButton('OPEN EVENT', eventUrl)
              }
            },
            {
              keyValue: {
                topLabel: 'ref',
                content: ref
              }
            }
          ]
        },
        {
          widgets: [{
            buttons: [textButton('OPEN CHECKS', checksUrl)]
          }]
        }
      ]
    }]
  };
  const commitMessage = payload.commits.pop();
  if (commitMessage) {
    body.cards[0].sections[1].widgets.push({
      keyValue: {
        topLabel: 'Commit Msg',
        content: `${commitMessage.author.name}: "${commitMessage.message}"`
      }
    });
  }
  let response;
  try {
    response = await axios.default.post(url, body);
  } catch (e) {
    throw new Error(e.data.error);
  }
  if (response.status !== 200) {
    throw new Error(`Google Chat notification failed. response status=${response.status}`);
  }
}
