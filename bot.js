require("dotenv").config();

const {
  Bot,
  Keyboard,
  InlineKeyboard,
  GrammyError,
  HttpError,
  Context,
  session,
} = require("grammy");
const {
  getRandomQuestion,
  getCorrectAnswer,
  getMoreInformation,
  changeQuestionId
} = require("./utils");

const bot = new Bot(process.env.BOT_API_KEY);

bot.api.setMyCommands([
  {
    command: "start",
    description: "Start the quiz ▶️",
  },
  {
    command: "finish",
    description: "Finish the quiz 🏁",
  }
]);

function createInitialSessionData() {
  return {
    explanation: {},
    pastQuestions: {
      "html": [],
      "javascript": [],
      "react": [],
      "node": [],
     }
  };
}

bot.use(session({ initial: createInitialSessionData }));

bot.command("finish", async (ctx) => {
  createInitialSessionData();
  await ctx.reply("Quiz has been finished! \n\nTo start again - please type /start");
});

bot.command("start", async (ctx) => {
  const mainMenuKeyboard = new Keyboard()
    .text("HTML")
    .text("JavaScript")
    .row()
    .text("React")
    .text("Node")
    .row()
    .text("Random question")
    .resized();

  await ctx.reply(
    "Hello! I am a quiz bot for a Full Stack Developer Interview. \n\nI will ask you questions to test your knowledge."
  );
  await ctx.reply(
    "To see the question - please select a category of questions: \n(Click <⌘> if you are on PC)",
    {
      reply_markup: mainMenuKeyboard,
    }
  );
});


bot.hears(
  [
    "HTML",
    "JavaScript",
    "React",
    "Node",
    "Random question",
  ],
  async (ctx) => {
    const category = ctx.message.text.toLowerCase();
    let { question, questionCategory } = getRandomQuestion(category);
    let questionKeyboard;

    if (ctx.session.pastQuestions[questionCategory].includes(question.id)) {
     let changeIdArray = ctx.session.pastQuestions[questionCategory];
     let questionId = question.id;

     let { newQuestion, newQuestionId, restart } = changeQuestionId(questionCategory, changeIdArray, questionId);
     
      if (restart) {
        ctx.session.pastQuestions[questionCategory] = [];
        return ctx.reply("All questions from this category have been asked! \nPlease select another one 😉");
      }
     
     ctx.session.pastQuestions[questionCategory].push(newQuestionId)
     question = newQuestion;
    }

    else {
      ctx.session.pastQuestions[questionCategory].push(question.id)
    }

    if (question.hasOptions) {
      const buttons = question.options.map((option) => {
        return [
          InlineKeyboard.text(
            option.text,
            JSON.stringify({
              type: `${questionCategory}-option`,
              isCorrect: option.isCorrect,
              questionId: question.id,
            })
          ),
        ];
      });
      questionKeyboard = InlineKeyboard.from(buttons);
    } else {
      questionKeyboard = new InlineKeyboard().text(
        "Get the answer",
        JSON.stringify({
          type: questionCategory,
          questionId: question.id,
        })
      );
    }

    await ctx.reply(question.text, {
      reply_markup: questionKeyboard,
    });
  }
);

bot.callbackQuery("explain-button", async (ctx) => {
  await ctx.reply(`<b>Explanation: </b> \n${ctx.session.explanation}`, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  await ctx.answerCallbackQuery();
  return ctx.session.explanation = {};
});

function explainKeyboardFunc() {
  const explainKeyboard = new InlineKeyboard()
  .text("Yes, explain more", "explain-button")
  .text("No");

  return explainKeyboard;
}

bot.on("callback_query:data", async (ctx, next) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);
  let explanationData;

  if (!callbackData.type.includes("option")) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    explanationData = getMoreInformation(
      callbackData.type,
      callbackData.questionId
    );
    ctx.session.explanation = explanationData;

    await ctx.reply(answer);
    await ctx.reply("Would you like to see an explanation?", {
      reply_markup: explainKeyboardFunc()
    })

    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply(`Correct! 🎉`);
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split("-")[0],
    callbackData.questionId
  );
  explanationData = getMoreInformation(
    callbackData.type.split("-")[0],
    callbackData.questionId
  );

  await ctx.reply(`Wrong answer! 😔 \nThe correct answer is: ${answer}`);
  ctx.session.explanation = explanationData;

  await ctx.reply("Would you like to see an explanation?", {
    reply_markup: explainKeyboardFunc()
  })
  return;
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
