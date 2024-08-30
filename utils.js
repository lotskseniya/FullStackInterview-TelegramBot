const questions = require("./questions.json");
const { Random } = require("random-js");

const random = new Random();

const getRandomQuestion = (category) => {
  let questionCategory = category.toLowerCase();

  if (questionCategory === "random question") {
    questionCategory =
      Object.keys(questions)[
        Math.floor(Math.random() * (Object.keys(questions).length - 1))
      ];
  }

  let getRandomQuestionIndex = random.integer(
    0,
    questions[questionCategory].length - 1
  );

  return {
    question: questions[questionCategory][getRandomQuestionIndex],
    questionCategory,
  };
};

const changeQuestionId = (questionCategory, changeIdArray, questionId) => {
  let restart = false;

  let newQuestionId = random.integer(0, questions[questionCategory].length - 1);
  if (changeIdArray.includes(newQuestionId)) {
    return changeQuestionId(questionCategory, changeIdArray, questionId);
  }

  if (changeIdArray.length === (questions[questionCategory].length - 1)) {
    restart = true;
  }

  return {
    newQuestion: questions[questionCategory][newQuestionId],
    newQuestionId,
    restart
  };
};

const getCorrectAnswer = (category, questionId) => {
  const question = questions[category].find(
    (question) => question.id === questionId
  );

  if (!question.hasOptions) {
    return question.answer;
  }

  return question.options.find((option) => option.isCorrect).text;
};

const getMoreInformation = (category, questionId) => {
  const question = questions[category].find(
    (question) => question.id === questionId
  );

  return question.explanation;
};

module.exports = {
  getRandomQuestion,
  getCorrectAnswer,
  getMoreInformation,
  changeQuestionId,
};
