const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

app.message('hello', async ({ message, say }) => {
  console.log('app listen');
  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hey there <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "button_click"
        }
      }
    ],
    text: `Hey there <@${message.user}>!`
  });
});

app.event('reaction_added', async ({ event, say }) => {
  if (event.reaction === 'calendar') {
    await say({
      blocks: [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Pick a date for me to remind you"
        },
        "accessory": {
          "type": "datepicker",
          "action_id": "datepicker_remind",
          "initial_date": "2019-04-28",
          "placeholder": {
            "type": "plain_text",
            "text": "Select a date"
          }
        }
      }]
    });
  }
});

app.action('button_click', async ({ body, ack, say }) => {
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});

const postAt = '1657615560';
app.message('wake me up', async ({ message, context, logger }) => {
  try {
    const result = await app.client.chat.scheduleMessage({
      token: context.botToken,
      channel: message.channel,
      post_at: postAt,
      text: 'remind: 2022/7/12 17:44'
    });
  }
  catch (error) {
    logger.error(error);
  }
});

app.command('/echo', async ({ command, ack, respond }) => {
  await ack();

  await respond(`${command.text}`);
});

app.command('/diary', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'diary_view',
        title: {
          type: 'plain_text',
          text: '今日を記録しよう'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'impression_block',
            label: {
              type: 'plain_text',
              text: '今日一日で印象に残った出来事はなんですか？'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'impression_input',
              multiline: true
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: '送信'
        }
      }
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
  }
});


app.view('diary_view', async ({ ack, body, view, client, logger }) => {
  await ack();

  const impressiveEvent = view['state']['values']['impression_block']['impression_input'];
  const user = body['user']['id'];

  try {
    await client.chat.postMessage({
      channel: user,
      text: impressiveEvent.value
    });
  }
  catch (error) {
    logger.error(error);
  }

});

(async () => {
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();