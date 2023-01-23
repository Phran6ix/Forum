const Forum = require("../../model/Forum/forum.model");
const Topic = require("../../model/Topic/topic.model");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

exports.createATopic = catchAsync(async (req, res, next) => {
  const { content, forum } = req.body;
  const user = await req.user.populate({
    path: "forums",
    select: "name followers enrolled photo",
  });

  const forumExist = await Forum.findOne({ name: forum }).populate(
    "enrolled",
    "id"
  );

  if (!forumExist) {
    return next(new AppError("Forum does not exist", 400));
  }

  if (
    !forumExist.enrolled.find((user) => {
      return (user = req.user.id);
    })
  ) {
    return next(new AppError("You are not enrolled in this forum", 400));
  }

  const newTopic = new Topic({
    topic: content,
    uploader: user.id,
    forum,
  });
  const savedTopic = await newTopic.save();

  forumExist.topics.push(savedTopic.id);
  await forumExist.save();

  res.status(201).json({
    success: true,
    topic: newTopic,
  });
});

exports.pinATopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.topic_id);

  const alreadtPinned = topic.pins.find((user) => {
    return (user = req.user.id);
  });
  if (alreadtPinned) {
    return next(new AppError("Already pinned this tweet", 400));
  }

  topic.pins.push(req.user.id);
  await topic.save();

  res.status(200).json({
    success: true,
    message: "Topic pinned",
  });
});

exports.answerATopic = catchAsync(async (req, res, next) => {
  const { answer } = req.body;
  const user = req.user;
  const topic = await Topic.findById(req.params.topic_id);

  topic.answer.push({
    content: answer,
    replied_by: user.id,
  });
  await topic.save();

  res.status(201).json({
    success: true,
    answer,
  });
});

exports.getAllTopicOnForum = catchAsync(async (req, res, next) => {
  const { forum_name } = req.body;
  const Currentuser = req.user;

  const forum = await Forum.findOne({ name: forum_name }).populate({
    path: "topics",
    select: "topic answer pins uploader forum replies createdAt ",
    populate: "uploader",
  });
  if (!forum) {
    return next(new AppError("Forum does not exist", 404));
  }
  if (
    !forum.enrolled.find((user) => {
      return (user = Currentuser.id);
    })
  ) {
    return next(new AppError("You are not enrolled in this forum", 403));
  }

  const topics = forum.topics;

  res.status(200).json({
    success: true,
    topics,
  });
});

exports.getATopic = catchAsync(async (req, res, next) => {
  const { topic_id } = req.params;

  const topic = await Topic.findById(topic_id).populate({
    path: "uploader",
    select: "firstName lastName middleName occupation photo",
  });

  res.status(200).json({
    success: true,
    topic,
  });
});

exports.replyATopic = catchAsync(async (req, res, next) => {
  const { topic_id } = req.params;
  const { reply } = req.body;

  const topic = await Topic.findById(topic_id).populate({
    path: "uploader",
    select: "firstName lastName middleName occupation photo",
  });

  if (!topic) {
    return next(new AppError("Topic not found", 404));
  }

  topic.replies.push({
    reply,
    replied_by: req.user.id,
  });

  await topic.save();

  res.status(200).json({
    success: true,
    data: { reply },
  });
});
