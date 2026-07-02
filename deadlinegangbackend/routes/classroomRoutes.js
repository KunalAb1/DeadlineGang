const express = require('express');
const Classroom = require('../Models/classroomModel');
const User = require('../Models/userModel');
const Post = require('../Models/postModel');
const ClassroomJoin = require('../Models/classroomJoinModel');
const responseFunction = require('../utils/responseFunction');
const authTokenHandler = require('../Middlewares/checkAuthToken');
const router = express.Router();
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer - store file in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

// Determine correct Cloudinary resource_type based on mimetype
const getResourceType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    // PDFs, Word, Excel, ZIP, etc. all go under 'raw'
    return 'raw';
};

// Utility: upload buffer to Cloudinary with correct resource_type
const uploadToCloudinary = (buffer, originalName, mimetype) => {
    return new Promise((resolve, reject) => {
        const resourceType = getResourceType(mimetype);
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder: 'deadlinegang',
                public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')}`,
                // Keep original format for raw files so extension is preserved
                ...(resourceType === 'raw' && { format: originalName.split('.').pop() }),
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// Utility function to send email
const mailer = async (receiverEmail, code) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.COMPANY_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    let info = await transporter.sendMail({
        from: "Team DeadlineGang",
        to: receiverEmail,
        subject: "OTP for DeadlineGang",
        text: "Your OTP is " + code,
        html: "<b>Your OTP is " + code + "</b>",
    });
    return info.messageId ? true : false;
};

router.post('/create', authTokenHandler, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return responseFunction(res, 400, 'Classroom name is required', null, false);
    try {
        const newClassroom = new Classroom({ name, description, owner: req.userId });
        await newClassroom.save();
        return responseFunction(res, 201, 'Classroom created successfully', newClassroom, true);
    } catch (err) {
        return responseFunction(res, 500, 'Internal server error', err, false);
    }
});

router.get('/classroomscreatedbyme', authTokenHandler, async (req, res) => {
    try {
        const classrooms = await Classroom.find({ owner: req.userId });
        return responseFunction(res, 200, 'Classrooms fetched successfully', classrooms, true);
    } catch (err) {
        return responseFunction(res, 500, 'Internal server error', err, false);
    }
});

router.get('/getclassbyid/:classid', authTokenHandler, async (req, res) => {
    const { classid } = req.params;
    try {
        const classroom = await Classroom.findById(classid).populate('posts');
        if (!classroom) return responseFunction(res, 404, 'Classroom not found', null, false);
        return responseFunction(res, 200, 'Classroom fetched successfully', classroom, true);
    } catch (err) {
        return responseFunction(res, 500, 'Internal server error', err, false);
    }
});

// addpost route with file upload support
router.post('/addpost', authTokenHandler, upload.single('file'), async (req, res) => {
    const { title, description, classId } = req.body;
    try {
        const classroom = await Classroom.findById(classId);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        let fileUrl = null;
        let fileName = null;
        let fileType = null;
        let cloudinaryPublicId = null;
        let cloudinaryResourceType = null;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
            console.log('Cloudinary upload result:', {
                resource_type: result.resource_type,
                secure_url: result.secure_url,
                bytes: result.bytes,
            });
            fileUrl = result.secure_url;
            fileName = req.file.originalname;
            fileType = req.file.mimetype;
            cloudinaryPublicId = result.public_id;
            cloudinaryResourceType = result.resource_type;
        }

        const newPost = new Post({
            title,
            description,
            classId,
            createdBy: req.userId,
            fileUrl,
            fileName,
            fileType,
            cloudinaryPublicId,
            cloudinaryResourceType,
        });
        await newPost.save();

        classroom.posts.push(newPost._id);
        await classroom.save();

        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.error('Add post error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Edit post (title/description only)
router.put('/editpost/:postId', authTokenHandler, async (req, res) => {
    const { postId } = req.params;
    const { title, description } = req.body;
    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.createdBy.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }
        post.title = title ?? post.title;
        post.description = description ?? post.description;
        await post.save();
        res.status(200).json({ message: 'Post updated successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete post
router.delete('/deletepost/:postId', authTokenHandler, async (req, res) => {
    const { postId } = req.params;
    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.createdBy.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Delete file from Cloudinary if it exists
        if (post.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(post.cloudinaryPublicId, {
                    resource_type: post.cloudinaryResourceType || 'raw',
                });
            } catch (cloudErr) {
                console.error('Cloudinary delete error:', cloudErr);
            }
        }

        // Remove post reference from classroom
        await Classroom.findByIdAndUpdate(post.classId, { $pull: { posts: post._id } });
        await Post.findByIdAndDelete(postId);

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/classrooms/search', async (req, res) => {
    try {
        const term = req.query.term;
        if (!term) return responseFunction(res, 400, 'Search term is required', null, false);
        const results = await Classroom.find({ name: { $regex: new RegExp(term, 'i') } });
        if (results.length === 0) return responseFunction(res, 404, 'Classroom not found', null, false);
        responseFunction(res, 200, 'Search results', results, true);
    } catch (error) {
        responseFunction(res, 500, 'Internal server error', error, false);
    }
});

router.post('/request-to-join', async (req, res) => {
     console.log('request-to-join hit', req.body);
    const { classroomId, studentEmail } = req.body;
    if (!classroomId || !studentEmail) return responseFunction(res, 400, 'Classroom ID and student email are required', null, false);
    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return responseFunction(res, 404, 'Classroom not found', null, false);
        const classOwner = await User.findById(classroom.owner);
        if (!classOwner) return responseFunction(res, 404, 'Class owner not found', null, false);
        const code = Math.floor(100000 + Math.random() * 900000);
        const isSent = await mailer(classOwner.email, code);
        if (!isSent) return responseFunction(res, 500, 'Failed to send OTP', null, false);
        const newClassroomJoin = new ClassroomJoin({ classroomId, studentEmail, code, classOwnerEmail: classOwner.email });
        await newClassroomJoin.save();
        return responseFunction(res, 200, 'OTP sent to the class owner', null, true);
    } catch (err) {
        return responseFunction(res, 500, 'Internal server error', err, false);
    }
});

router.post('/verify-otp', authTokenHandler, async (req, res) => {
    const { classroomId, studentEmail, otp } = req.body;
    if (!classroomId || !studentEmail || !otp) return responseFunction(res, 400, 'All fields required', null, false);
    try {
        const joinRequest = await ClassroomJoin.findOne({ classroomId, studentEmail, code: otp });
        if (!joinRequest) return responseFunction(res, 400, 'Invalid OTP or join request not found', null, false);
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return responseFunction(res, 404, 'Classroom not found', null, false);
        if (!classroom.students.includes(studentEmail)) {
            classroom.students.push(studentEmail);
            await classroom.save();
        }
        await ClassroomJoin.deleteOne({ _id: joinRequest._id });
        return responseFunction(res, 200, 'Successfully joined the class', null, true);
    } catch (err) {
        return responseFunction(res, 500, 'Internal server error', err, false);
    }
});

router.get('/classroomsforstudent', authTokenHandler, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return responseFunction(res, 404, 'User not found', null, false);
        const classrooms = await Classroom.find({ students: user.email });
        if (classrooms.length === 0) return responseFunction(res, 404, 'No classrooms found', null, false);
        return responseFunction(res, 200, 'Classrooms fetched successfully', classrooms, true);
    } catch (err) {
        return responseFunction(res, 500, 'Internal server error', err, false);
    }
});

module.exports = router;