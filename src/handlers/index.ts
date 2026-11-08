/**
 * @module handlers/index
 * @description Event handlers router for Jira and Confluence asynchronous webhook triggers.
 */

export { onJiraEvent } from './jira-events';
export { onConfluenceEvent } from './confluence-events';

