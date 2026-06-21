const express = require('express');
const router = express.Router();
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel'); // Added to support Signals

// 1. CREATE: Save a new post (Supports text, multiple media URLs, and visibility)
router.post('/create', async (req, res) => {
  try {
    const { authorEmail, authorName, text, media, visibility } = req.body;
    const newPost = new Post({ 
      authorEmail, 
      authorName, 
      text, 
      media, // Now an array for multi-image support
      visibility 
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: "Failed to save post" });
  }
});

// 2. GET PUBLIC: Fetch all public posts for the For You Page
router.get('/public', async (req, res) => {
  try {
    const publicPosts = await Post.find({ visibility: 'public' })
      .sort({ createdAt: -1 }); 
    res.json(publicPosts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public feed" });
  }
});

// 3. GET BRIDGE: Fetch Private Partner posts
router.get('/bridge/:myEmail/:partnerEmail', async (req, res) => {
  const { myEmail, partnerEmail } = req.params;
  try {
    const posts = await Post.find({
      authorEmail: { $in: [myEmail, partnerEmail] },
      visibility: 'partner'
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Bridge posts" });
  }
});

// 4. INSPIRE (Like): Add email to likes and trigger a Signal
router.post('/inspire/:id', async (req, res) => {
  const { email } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    
    if (post.likes.includes(email)) return res.status(400).send("Already inspired");
    
    post.likes.push(email);
    await post.save();

    // TRIGGER SIGNAL: Notify the author (unless it's your own post)
    if (post.authorEmail !== email) {
      await Notification.create({
        recipientEmail: post.authorEmail,
        senderName: email.split('@')[0], 
        type: 'like',
        content: `inspired your vision: "${post.text?.substring(0, 20)}..."`,
        relatedId: post._id
      });
    }

    res.json(post);
  } catch (err) { res.status(500).send(err); }
});

// 5. ECHO (Comment): Add comment and trigger a Signal
router.post('/echo/:id', async (req, res) => {
  const { userEmail, userName, text } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    post.comments.push({ userEmail, userName, text });
    await post.save();

    // TRIGGER SIGNAL: Notify the author
    if (post.authorEmail !== userEmail) {
      await Notification.create({
        recipientEmail: post.authorEmail,
        senderName: userName || userEmail.split('@')[0],
        type: 'comment',
        content: `echoed: "${text.substring(0, 20)}..."`,
        relatedId: post._id
      });
    }

    res.json(post);
  } catch (err) { res.status(500).send(err); }
});

// 6. DELETE: Remove a post
router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;