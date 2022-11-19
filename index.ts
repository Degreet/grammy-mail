import { Context } from 'grammy';
import chunk from 'chunk';

export interface IMailParams {
  text?: string;
  other?: any;
  messageSender?: (userId: number) => Promise<any> | any;
  onSend?: (userId: number, isSuccess: boolean) => Promise<any> | any;
  onEnd?: (success: number, failed: number) => Promise<any> | any;
}

export async function mailUsers(ctx: Context & any, users: number[], params: IMailParams) {
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
        let isSuccess = true;

        if (params.messageSender) {
          await params.messageSender(userId).catch(() => {});
        } else if (params.text) {
          await ctx.api.sendMessage(userId, params.text, params.other);
        }

        if (isSuccess) success++;
        else failed++;

        if (params.onSend) {
          try {
            await params.onSend(userId, isSuccess);
          } catch {
            params.onSend(userId, isSuccess);
          }
        }
      }),
    );

    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await step());
      }, Math.max(0, startedAt + 1000 - Date.now()));
    });
  }

  return step();
}
