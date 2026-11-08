/**
 * @module index
 * @description Main entry point exporting Forge resolvers and event handler functions.
 */

export { handler } from './resolvers/index';
export { onJiraEvent, onConfluenceEvent } from './handlers/index';

