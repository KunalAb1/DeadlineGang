const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileUrl: {
        type: String,
        default: null,
    },
    fileName: {
        type: String,
        default: null,
    },
    fileType: {
        type: String,
        default: null,
    },
    cloudinaryPublicId: {
        type: String,
        default: null,
    },
    cloudinaryResourceType: {
        type: String,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);