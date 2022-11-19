# Mailing users

This library was created for mailing users in the grammY framework

# How to use

1. Install library

```nginx
yarn add grammy-mail
// or
npm i grammy-mail
```

2. Use library

```typescript
import { mailUsers } from 'grammy-mail';

bot.command('mail', async (ctx: Context) => {
  const users = [1, 2, 3]; // user ids you want to mail
  
  mailUsers<Context>(ctx, users, { // start mail
    text: 'Hello, world!', // mail text
    other: { parse_mode: 'HTML' }, // add other params to message (grammY api .reply)
    messageSender: (userId: number) =>  // or use custom mail function
      ctx.api.sendMessage(userId, 'Hello, world!', { parse_mode: 'HTML' }),
    onSend: (userId: number, isSuccess: boolean) => // callback on every mail
      console.log(userId, isSuccess ? 'recieved' : 'not recieved', 'mail'),
    onEnd: (success: number, failed: number) => // callback on mail end
      ctx.reply(`Mail end. ${success} - success mails, ${failed} - failed mails`),
  });
});
```
