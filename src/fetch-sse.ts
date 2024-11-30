import type { HttpClient } from '@actions/http-client';
import { debug } from '@actions/core';

const ONE_HOUR_IN_MS = 3600000;
const SSE_DATA_PREFIX = 'data: ';

// Fetch last event from SSE stream
export async function fetchSSE({
  httpClient,
  payload,
  url
}: {
  httpClient: HttpClient;
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<any> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const response = await httpClient.post(url, JSON.stringify(payload), {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        // Note 100% sure this does anything, but we'll keep it here
        socketTimeout: 5 * ONE_HOUR_IN_MS
      });

      if (response.message.statusCode !== 200) {
        throw new Error(`HTTP error! status: ${response.message.statusCode}`);
      }
      if (!response.message.readable) {
        throw new Error('Stream not readable');
      }

      let lastMessage: string | undefined = undefined;
      let buffer = '';

      for await (const chunk of response.message) {
        buffer += chunk.toString();

        // Split on double newlines to separate SSE messages
        const messages = buffer.split('\n\n');
        // Keep the last item in buffer if it's incomplete
        buffer = messages.pop() || '';

        for (const message of messages) {
          debug(`SSE message: ${message}}`);
          // Check if it's a data message and extract the content
          if (message.startsWith(SSE_DATA_PREFIX)) {
            lastMessage = message;
          }
        }
      }
      if (!lastMessage) {
        throw new Error('Last stream message empty');
      }
      // Removes 'data: ' prefix, only leaving us with JSON string
      const data: {
        status: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result: any;
      } = JSON.parse(lastMessage.slice(SSE_DATA_PREFIX.length).trim());
      // TODO: Would be nicer to use zod here
      if (data.status !== 'success') {
        throw new Error(`Stream did not end in success: ${data}`);
      }
      resolve(data.result);
    } catch (error) {
      reject(error);
    }
  });
}
