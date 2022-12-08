import { Message } from '@grammyjs/types/message';
import { Context } from 'grammy';
import chunk from 'chunk';

export interface IMailParams {
  text?: string;
  other?: any;
  messageSender?: (userId: number) => Promise<any> | any;
  filter?: (userId: number) => Promise<boolean> | boolean;
  onSend?: (userId: number, isSuccess: boolean, messageId?: number) => Promise<any> | any;
  onEnd?: (success: number, failed: number) => Promise<any> | any;
}

export async function mailUsers<T extends Context>(ctx: T, users: number[], params: IMailParams) {
  if (!params.text && !params.messageSender)
    throw new Error('You must have a way to send a message to the user');

  const parts = chunk(users, 30);
  let activePart = 0,
    success = 0,
    failed = 0;

  async function end() {
    return params.onEnd && params.onEnd(success, failed);
  }

  async function step() {
    const startedAt = Date.now();
    const part = parts[activePart++];

    if (!part || !part.length) {
      return end();
    }

    await Promise.all(
      part.map(async (userId: number) => {
        if (!!params.filter) {
          try {
            if (!(await params.filter(userId))) return;
          } catch {
            if (!params.filter(userId)) return;
          }
        }

        let isSuccess = true,
          msgId;

        if (params.messageSender) {
          msgId = await params.messageSender(userId).catch(() => (isSuccess = false));
        } else if (params.text) {
          msgId = (
            (await ctx.api
              .sendMessage(userId, params.text, params.other)
              .catch(() => (isSuccess = false))) as Message.TextMessage
          )?.message_id;
        }

        if (isSuccess) success++;
        else failed++;

        if (params.onSend) {
          try {
            await params.onSend(userId, isSuccess, msgId);
          } catch {
            params.onSend(userId, isSuccess, msgId);
          }
        }
      }),
    );

    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(step());
      }, Math.max(0, startedAt + 1000 - Date.now()));
    });
  }

  return step();
}
