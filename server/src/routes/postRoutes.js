const express = require('express');
const router = express.Router();
const Post = require('../models/postModel');
const Notification = require('../models/notificationModel');

// 1. CREATE: Save a new post
router.post('/create', async (req, res) => {
  try {
    const { authorEmail, authorName, text, media, tags, visibility } = req.body;
    const newPost = new Post({ 
      authorEmail, 
      authorName, 
      text, 
      media: Array.isArray(media) ? media : (media ? [media] : []),
      tags: tags || [],
      visibility: visibility || 'partner' 
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: "Failed to save post" });
  }
});

// 2. GET PUBLIC FEED: Supports both /public and /public-feed
const getPublicPosts = async (req, res) => {
  try {
    const publicPosts = await Post.find({ visibility: 'public' }).sort({ createdAt: -1 });
    res.json(publicPosts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public feed" });
  }
};
router.get('/public', getPublicPosts);
router.get('/public-feed', getPublicPosts);

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

// 4. INSPIRE (Toggle Like): Supports toggle on/off and triggers a Signal
router.post('/inspire/:id', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const existingIndex = post.likes.indexOf(email);
    let hasLiked = false;

    if (existingIndex > -1) {
      // Toggle off
      post.likes.splice(existingIndex, 1);
    } else {
      // Toggle on
      post.likes.push(email);
      hasLiked = true;

      // Trigger Signal Notification to author
      if (post.authorEmail !== email) {
        await Notification.create({
          recipientEmail: post.authorEmail,
          senderName: email.split('@')[0],
          type: 'like',
          content: `inspired your vision: "${post.text?.substring(0, 20) || 'media'}..."`,
          relatedId: post._id
        });
      }
    }

    await post.save();
    res.json({ success: true, likes: post.likes, hasLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ECHO (Comment): Add comment and trigger a Signal
router.post('/echo/:id', async (req, res) => {
  const { userEmail, userName, text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Comment text required" });

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = {
      userEmail,
      userName: userName || userEmail.split('@')[0],
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Trigger Signal Notification
    if (post.authorEmail !== userEmail) {
      await Notification.create({
        recipientEmail: post.authorEmail,
        senderName: userName || userEmail.split('@')[0],
        type: 'comment',
        content: `echoed: "${text.substring(0, 20)}..."`,
        relatedId: post._id
      });
    }

    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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